// Import Mongoose library
const mongoose = require('mongoose');

// Define User schema
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, index: true },
  email: { type: String, unique: true, index: true },
  password: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Define Event schema
const EventSchema = new mongoose.Schema({
  name: { type: String, index: true },
  location: String,
  date: Date,
  time: String,
  limit: Number,
  organizer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Define JoinEventRequest schema
const JoinEventRequestSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Define Player schema
const PlayerSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Create User model
const User = mongoose.model('User', UserSchema);

// Create Event model
const Event = mongoose.model('Event', EventSchema);

// Create JoinEventRequest model
const JoinEventRequest = mongoose.model('JoinEventRequest', JoinEventRequestSchema);

// Create Player model
const Player = mongoose.model('Player', PlayerSchema);

module.exports = {
    User,
    Event,
    JoinEventRequest,
    Player
  };