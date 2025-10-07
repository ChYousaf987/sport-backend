const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: "",
  },
  location: {
    type: String,
    trim: true,
    default: "",
  },
  country: {
    type: String,
    trim: true,
    default: "",
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Neither Male Nor Female", ""],
    default: "",
  },
  age: {
    type: Number,
    min: 13,
    max: 120,
    default: null,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  profileImage: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ["user", "organizer", "admin"],
    default: "user",
  },
  roleChangeRequests: [
    {
      requestedRole: {
        type: String,
        enum: ["user", "organizer", "admin"],
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      submittedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  otp: {
    type: String,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  // Additional fields from Edit_Player_Profile.jsx
  preferredSport: {
    type: String,
    trim: true,
    default: "",
  },
  skillLevel: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced", "Professional", ""],
    default: "",
  },
  playingPosition: {
    type: String,
    trim: true,
    default: "",
  },
  availability: {
    type: String,
    trim: true,
    default: "",
  },
  totalMatchesPlayed: {
    type: Number,
    default: 0,
  },
  winLosses: {
    type: String,
    trim: true,
    default: "",
  },
  trophiesAndMedals: {
    type: String,
    trim: true,
    default: "",
  },
  rankingAndRating: {
    type: String,
    trim: true,
    default: "",
  },
  teamSizePreference: {
    type: String,
    trim: true,
    default: "",
  },
  maxPlayersPerTeam: {
    type: String,
    trim: true,
    default: "",
  },
  participationType: {
    type: String,
    trim: true,
    default: "",
  },
  registrationLimit: {
    type: String,
    trim: true,
    default: "",
  },
  paymentMethod: {
    type: String,
    trim: true,
    default: "",
  },
  profileVisible: {
    type: Boolean,
    default: true,
  },
  allowNotifications: {
    type: Boolean,
    default: true,
  },
  allowOrganizerRole: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);