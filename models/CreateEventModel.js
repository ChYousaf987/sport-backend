const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  eventTitle: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
    trim: true,
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  sport: {
    type: String,
    required: [true, 'Sport is required'],
    enum: {
      values: ['Football', 'Basketball', 'Tennis', 'Cricket'],
      message: '{VALUE} is not a valid sport',
    },
  },
  organizerName: {
    type: String,
    required: [true, 'Organizer name is required'],
    trim: true,
  },
  organizerGender: {
    type: String,
    required: [true, 'Organizer gender is required'],
    enum: {
      values: ['Male', 'Female', 'Other'],
      message: '{VALUE} is not a valid organizer gender',
    },
  },
  contactNumber1: {
    type: String,
    required: [true, 'Contact number 1 is required'],
    match: [/^\d{10,15}$/, 'Invalid phone number format (e.g., 1234567890)'],
  },
  contactNumber2: {
    type: String,
    match: [/^\d{10,15}$/, 'Invalid phone number format (e.g., 1234567890)'],
    default: '',
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
  },
  teamSizeLimit: {
    type: Number,
    required: [true, 'Team size limit is required'],
    min: [1, 'Team size limit must be at least 1'],
  },
  maxPlayersPerTeam: {
    type: Number,
    required: [true, 'Max players per team is required'],
    min: [1, 'Max players per team must be at least 1'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Amateur', 'Professional', 'Recreational', 'Competitive'],
      message: '{VALUE} is not a valid category',
    },
  },
  rules: {
    type: [String],
    default: [],
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: {
      values: ['Tournament', 'League', 'Friendly', 'Training'],
      message: '{VALUE} is not a valid type',
    },
  },
  registrationLimit: {
    type: Number,
    required: [true, 'Registration limit is required'],
    min: [1, 'Registration limit must be at least 1'],
  },
  playerGender: {
    type: String,
    required: [true, 'Player gender is required'],
    enum: {
      values: ['Male', 'Female', 'Mixed', 'Any'],
      message: '{VALUE} is not a valid player gender',
    },
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [1, 'Age must be at least 1'],
  },
  registrationFee: {
    type: Number,
    required: [true, 'Registration fee is required'],
    min: [0, 'Registration fee cannot be negative'],
  },
  eventFeeMethod: {
    type: String,
    required: [true, 'Event fee method is required'],
    enum: {
      values: ['Per Team', 'Per Player', 'Free'],
      message: '{VALUE} is not a valid event fee method',
    },
  },
  features: {
    type: [String],
    default: [],
  },
  media: {
    type: [String],
    default: [],
  },
});

// Prevent model overwrite
module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);