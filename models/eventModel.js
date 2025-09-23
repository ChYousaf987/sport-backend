// models/eventModel.js
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  eventTitle: {
    type: String,
    required: [true, "Event title is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
  },
  date: {
    type: Date,
    required: [true, "Date is required"],
  },
  time: {
    type: String,
    required: [true, "Time is required"],
  },
  location: {
    type: String,
    required: [true, "Location is required"],
    trim: true,
  },
  sport: {
    type: String,
    required: [true, "Sport is required"],
    enum: ["football", "basketball", "tennis", "other"],
  },
  organizerName: {
    type: String,
    required: [true, "Organizer name is required"],
    trim: true,
  },
  organizerGender: {
    type: String,
    required: [true, "Organizer gender is required"],
    enum: ["male", "female", "other"],
  },
  contactNumber1: {
    type: String,
    required: [true, "Primary contact number is required"],
    match: [
      /^\d{2}\s\d{3}\s\d{4}$/,
      "Invalid phone number format (e.g., 00 000 0000)",
    ],
  },
  contactNumber2: {
    type: String,
    match: [
      /^\d{2}\s\d{3}\s\d{4}$/,
      "Invalid phone number format (e.g., 00 000 0000)",
    ],
  },
  country: {
    type: String,
    required: [true, "Country is required"],
    trim: true,
  },
  city: {
    type: String,
    required: [true, "City is required"],
    trim: true,
  },
  teamSizeLimit: {
    type: Number,
    required: [true, "Team size limit is required"],
    min: [1, "Team size must be at least 1"],
  },
  maxPlayersPerTeam: {
    type: Number,
    required: [true, "Max players per team is required"],
    min: [1, "Max players must be at least 1"],
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: ["tournament", "friendlymatch"],
  },
  rules: {
    type: [String],
    default: [],
  },
  type: {
    type: String,
    required: [true, "Type is required"],
    enum: ["5v5", "8v8", "11v11"],
  },
  registrationLimit: {
    type: Number,
    required: [true, "Registration limit is required"],
    min: [1, "Registration limit must be at least 1"],
  },
  playerGender: {
    type: String,
    required: [true, "Player gender is required"],
    enum: ["male", "female", "other"],
  },
  age: {
    type: Number,
    required: [true, "Age is required"],
    min: [13, "Age must be at least 13"],
  },
  registrationFee: {
    type: Number,
    required: [true, "Registration fee is required"],
    min: [0, "Fee cannot be negative"],
  },
  eventFeeMethod: {
    type: String,
    required: [true, "Payment method is required"],
    enum: ["paypal", "stripe", "other"],
  },
  features: {
    type: [String],
    enum: ["live score", "leaderboard", "documents"],
    default: [],
  },
  media: {
    type: [String], // URLs or paths to images/videos
    default: [],
  },
  participants: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Event", eventSchema);
