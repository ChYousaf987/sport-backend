// models/roleRequestModel.js
const mongoose = require("mongoose");

const roleRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
  },
  phoneNumber1: {
    type: String,
    required: [true, "Primary phone number is required"],
    trim: true,
  },
  phoneNumber2: {
    type: String,
    required: [true, "Secondary phone number is required"],
    trim: true,
  },
  organizerType: {
    type: String,
    required: [true, "Organizer type is required"],
    enum: ["Business/Club", "Individual Organizer"],
  },
  city: {
    type: String,
    required: [true, "City is required"],
    trim: true,
  },
  region: {
    type: String,
    required: [true, "Region is required"],
    trim: true,
  },
  address: {
    type: String,
    required: [true, "Address is required"],
    trim: true,
  },
  sports: {
    type: [String],
    required: [true, "At least one sport is required"],
  },
  eventTypes: {
    type: [String],
    required: [true, "At least one event type is required"],
  },
  bankName: {
    type: String,
    required: [true, "Bank name is required"],
    trim: true,
  },
  accountNumber: {
    type: String,
    required: [true, "Account number is required"],
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("RoleRequest", roleRequestSchema);
