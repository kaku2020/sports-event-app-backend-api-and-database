// Import necessary modules
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Event = require('./database').Event;
const User = require('./database').User;
const JoinEventRequest = require('./database').JoinEventRequest;
const mongoose = require('mongoose');

// Create an instance of the Express application
const app = express();

// Set up middleware to parse request bodies
app.use(express.json());


// Set up default mongoose connection
const mongoDB = 'mongodb://localhost:27017/my_database';
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });



// Get the default connection
const db = mongoose.connection;

// Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Bind connection to open event (to get notification of successful connection)
db.once('open', function() {
  console.log('Connected to MongoDB database!');
});

// Set up a secret key for JWT authentication
const secretKey = 'mySecretKey';

// Define a helper function to generate JWT tokens
function generateToken(payload) {
  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
}

// Define a helper function to verify JWT tokens
function verifyToken(token) {
  return jwt.verify(token, secretKey);
}

// Define an API endpoint for user registration
app.post('/api/auth/register', async (req, res) => {
  try {
    // Hash the user's password before storing it in the database
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Create a new user document and save it to the database
    const user = new User({
      username: req.body.username,
      password: hashedPassword
    });
    await user.save();

    // Generate a JWT token for the new user
    const accessToken = generateToken({ id: user._id });

    // Send the access token back to the client
    res.json({ access_token: accessToken, token_type: 'bearer' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Define an API endpoint for user login
app.post('/api/auth/login', async (req, res) => {
  try {
    // Find the user in the database based on their username
    const user = await User.findOne({ username: req.body.username });

    // Check if the user exists and if their password is correct
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate a JWT token for the user
    const accessToken = generateToken({ id: user._id });

    // Send the access token back to the client
    res.json({ access_token: accessToken, token_type: 'bearer' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Define an API endpoint for retrieving all events
app.get('/api/events', async (req, res) => {
  try {
    // Find all events in the database and sort them by date and time
    const events = await Event.find().sort({ date: 1, time: 1 });

    // Send the list of events back to the client
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Define an API endpoint for retrieving a single event
app.get('/api/events/:eventId', async (req, res) => {
  try {
    // Find the event in the database based on its ID
    const event = await Event.findById(req.params.eventId);

    // If the event doesn't exist, return a 404 error
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if the current user can join
    // Check if the current user can join the event
    const user = await User.findById(req.user._id);
    const joinRequest = await JoinEventRequest.findOne({ event_id: event._id, user_id: user._id });

    // If the user has already joined the event, return a 400 error
    if (joinRequest && joinRequest.status === 'accepted') {
      return res.status(400).json({ error: 'User has already joined the event' });
    }

    // If the event is full, return a 400 error
    if (event.limit && event.limit <= event.players.length) {
      return res.status(400).json({ error: 'Event is already full' });
    }

    // Return the event in the response
    return res.status(200).json(event);
  }catch (error){
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
)

// Define an API endpoint for creating a new user account
app.post('/api/auth/register', async (req, res) => {
    try {
      // Extract the username and password from the request body
      const { username, password } = req.body;
  
      // Check if the username already exists in the database
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
  
      // Create a new user object with the given username and password
      const newUser = new User({ username, password });
  
      // Hash the password and store it in the database
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(newUser.password, salt);
      newUser.password = hashedPassword;
      await newUser.save();
  
      // Generate a new JWT token for the user
      const accessToken = jwt.sign({ username: newUser.username }, process.env.ACCESS_TOKEN_SECRET);
  
      // Return the access token in the response
      return res.status(201).json({ access_token: accessToken, token_type: 'bearer' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Define an API endpoint for logging in and generating a new JWT token
  app.post('/api/auth/token', async (req, res) => {
    try {
      // Extract the username and password from the request body
      const { username, password } = req.body;
  
      // Check if the username exists in the database
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      // Check if the password is correct
      const passwordMatches = await bcrypt.compare(password, user.password);
      if (!passwordMatches) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      // Generate a new JWT token for the user
      const accessToken = jwt.sign({ username: user.username }, process.env.ACCESS_TOKEN_SECRET);
  
      // Return the access token in the response
      return res.status(200).json({ access_token: accessToken, token_type: 'bearer' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Define an API endpoint for retrieving a list of all events
  app.get('/api/events', async (req, res) => {
    try {
      // Find all events in the database and sort them by date and time
      const events = await Event.find().sort({ date: 1, time: 1 });
  
      // Return the events in the response
      return res.status(200).json(events);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  
// Define an API endpoint for retrieving a single event
app.get('/api/events/:eventId', async (req, res) => {
    try {
      // Find the event in the database based on its ID
      const event = await Event.findById(req.params.eventId);
  
      // If the event doesn't exist, return a 404 error
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
  
      // Check if the current user has already joined the event
      const currentUser = await User.findById(req.user.id);
      const hasJoined = event.players.some((player) => player.user_id.toString() === currentUser._id.toString());
  
      // Return the event and whether the current user has already joined
      return res.status(200).json({ event, hasJoined });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.listen(4000, () => {
    console.log('Server is listening on port 4000');
  });