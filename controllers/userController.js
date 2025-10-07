const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure Uploads directory exists
const uploadsDir = path.join(__dirname, "../Uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, and .png files are allowed!"));
    }
  },
}).single("profileImage");

const signupUser = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    res.status(400);
    throw new Error("Please provide full name, email, and password");
  }
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const otp = crypto.randomInt(100000, 999999).toString();
  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    otp,
  });
  // Send OTP email (configure nodemailer as needed)
  res.status(201).json({ message: "User created, OTP sent to email", userId: user._id });
});

const verifyOTPUser = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.otp !== otp) {
    res.status(400);
    throw new Error("Invalid OTP");
  }
  user.otp = null;
  await user.save();
  res.status(200).json({
    message: "OTP verified successfully",
    userId: user._id,
    user: {
      userId: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  if (user.otp) {
    res.status(400);
    throw new Error("Please verify your email with OTP first");
  }
  if (await bcrypt.compare(password, user.password)) {
    res.status(200).json({
      userId: user._id,
      user: {
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400);
    throw new Error("User ID is required");
  }
  const user = await User.findById(userId).select(
    "-password -otp -resetPasswordToken -resetPasswordExpires"
  );
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.status(200).json({
    userId: user._id,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    location: user.location,
    country: user.country,
    gender: user.gender,
    age: user.age,
    description: user.description,
    profileImage: user.profileImage ? `http://localhost:3001/Uploads/${user.profileImage}` : null,
    role: user.role,
    preferredSport: user.preferredSport,
    skillLevel: user.skillLevel,
    playingPosition: user.playingPosition,
    availability: user.availability,
    totalMatchesPlayed: user.totalMatchesPlayed,
    winLosses: user.winLosses,
    trophiesAndMedals: user.trophiesAndMedals,
    rankingAndRating: user.rankingAndRating,
    teamSizePreference: user.teamSizePreference,
    maxPlayersPerTeam: user.maxPlayersPerTeam,
    participationType: user.participationType,
    registrationLimit: user.registrationLimit,
    paymentMethod: user.paymentMethod,
    profileVisible: user.profileVisible,
    allowNotifications: user.allowNotifications,
    allowOrganizerRole: user.allowOrganizerRole,
  });
});

const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const {
      userId,
      fullName,
      email,
      phoneNumber,
      location,
      gender,
      age,
      description,
      country,
      preferredSport,
      skillLevel,
      playingPosition,
      availability,
      totalMatchesPlayed,
      winLosses,
      trophiesAndMedals,
      rankingAndRating,
      teamSizePreference,
      maxPlayersPerTeam,
      participationType,
      registrationLimit,
      paymentMethod,
      profileVisible,
      allowNotifications,
      allowOrganizerRole,
    } = req.body;

    if (!userId) {
      res.status(400);
      throw new Error("User ID is required");
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (fullName !== undefined) user.fullName = fullName.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();
    if (location !== undefined) user.location = location.trim();
    if (country !== undefined) user.country = country.trim();
    if (gender !== undefined) user.gender = gender;
    if (age !== undefined) user.age = parseInt(age);
    if (description !== undefined) user.description = description.trim();
    if (preferredSport !== undefined) user.preferredSport = preferredSport.trim();
    if (skillLevel !== undefined) user.skillLevel = skillLevel;
    if (playingPosition !== undefined) user.playingPosition = playingPosition.trim();
    if (availability !== undefined) user.availability = availability.trim();
    if (totalMatchesPlayed !== undefined) user.totalMatchesPlayed = parseInt(totalMatchesPlayed);
    if (winLosses !== undefined) user.winLosses = winLosses.trim();
    if (trophiesAndMedals !== undefined) user.trophiesAndMedals = trophiesAndMedals.trim();
    if (rankingAndRating !== undefined) user.rankingAndRating = rankingAndRating.trim();
    if (teamSizePreference !== undefined) user.teamSizePreference = teamSizePreference.trim();
    if (maxPlayersPerTeam !== undefined) user.maxPlayersPerTeam = maxPlayersPerTeam.trim();
    if (participationType !== undefined) user.participationType = participationType.trim();
    if (registrationLimit !== undefined) user.registrationLimit = registrationLimit.trim();
    if (paymentMethod !== undefined) user.paymentMethod = paymentMethod.trim();
    if (profileVisible !== undefined) user.profileVisible = profileVisible === "true" || profileVisible === true;
    if (allowNotifications !== undefined) user.allowNotifications = allowNotifications === "true" || allowNotifications === true;
    if (allowOrganizerRole !== undefined) user.allowOrganizerRole = allowOrganizerRole === "true" || allowOrganizerRole === true;

    if (req.file) {
      console.log("Profile image uploaded:", req.file.path);
      user.profileImage = path.basename(req.file.path); // Store only filename
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        location: user.location,
        country: user.country,
        gender: user.gender,
        age: user.age,
        description: user.description,
        profileImage: user.profileImage ? `http://localhost:3001/Uploads/${user.profileImage}` : null,
        role: user.role,
        preferredSport: user.preferredSport,
        skillLevel: user.skillLevel,
        playingPosition: user.playingPosition,
        availability: user.availability,
        totalMatchesPlayed: user.totalMatchesPlayed,
        winLosses: user.winLosses,
        trophiesAndMedals: user.trophiesAndMedals,
        rankingAndRating: user.rankingAndRating,
        teamSizePreference: user.teamSizePreference,
        maxPlayersPerTeam: user.maxPlayersPerTeam,
        participationType: user.participationType,
        registrationLimit: user.registrationLimit,
        paymentMethod: user.paymentMethod,
        profileVisible: user.profileVisible,
        allowNotifications: user.allowNotifications,
        allowOrganizerRole: user.allowOrganizerRole,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
        console.log("Cleaned up failed upload:", req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }
    res.status(500);
    throw new Error(`Profile update failed: ${error.message}`);
  }
});

const submitRoleChange = asyncHandler(async (req, res) => {
  const { userId, requestedRole } = req.body;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  user.roleChangeRequests.push({ requestedRole });
  await user.save();
  res.status(200).json({ message: "Role change request submitted" });
});

const getRoleRequests = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400);
    throw new Error("User ID is required");
  }
  const user = await User.findById(userId);
  if (!user || user.role !== "admin") {
    res.status(403);
    throw new Error("Access denied: Admin role required");
  }
  const users = await User.find({
    "roleChangeRequests.status": "pending",
  }).select("fullName email role roleChangeRequests");
  res.status(200).json(users);
});

const manageRoleRequest = asyncHandler(async (req, res) => {
  const { userId, requestId, action } = req.body;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const request = user.roleChangeRequests.id(requestId);
  if (!request) {
    res.status(404);
    throw new Error("Role change request not found");
  }
  if (action === "approve") {
    user.role = request.requestedRole;
    request.status = "approved";
  } else if (action === "reject") {
    request.status = "rejected";
  } else {
    res.status(400);
    throw new Error("Invalid action");
  }
  await user.save();
  res.status(200).json({ message: `Role change request ${action}d` });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const resetToken = crypto.randomBytes(20).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();
  // Send reset email (configure nodemailer as needed)
  res.status(200).json({ message: "Password reset email sent" });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired reset token");
  }
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();
  res.status(200).json({ message: "Password reset successfully" });
});

const getOrganizers = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400);
    throw new Error("User ID is required");
  }
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const organizers = await User.find({ role: "organizer" }).select(
    "-password -otp -resetPasswordToken -resetPasswordExpires"
  );
  res.status(200).json(organizers);
});

const getPlayers = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400);
    throw new Error("User ID is required");
  }
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const players = await User.find({ role: "user" }).select(
    "-password -otp -resetPasswordToken -resetPasswordExpires"
  );
  res.status(200).json(players);
});

const getPlayerById = asyncHandler(async (req, res) => {
  const { userId, playerId } = req.body;

  if (!userId || !playerId) {
    res.status(400);
    throw new Error("User ID and Player ID are required");
  }

  const requestingUser = await User.findById(userId);
  if (!requestingUser) {
    res.status(404);
    throw new Error("Requesting user not found");
  }

  const user = await User.findById(playerId).select(
    "-password -otp -resetPasswordToken -resetPasswordExpires"
  );

  if (!user) {
    res.status(404);
    throw new Error("Player not found");
  }

  if (user.role !== "user") {
    res.status(400);
    throw new Error("Selected user is not a player");
  }

  res.status(200).json({
    userId: user._id,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    location: user.location,
    country: user.country,
    gender: user.gender,
    age: user.age,
    description: user.description,
    profileImage: user.profileImage ? `http://localhost:3001/Uploads/${user.profileImage}` : null,
    role: user.role,
    preferredSport: user.preferredSport,
    skillLevel: user.skillLevel,
    playingPosition: user.playingPosition,
    availability: user.availability,
    totalMatchesPlayed: user.totalMatchesPlayed,
    winLosses: user.winLosses,
    trophiesAndMedals: user.trophiesAndMedals,
    rankingAndRating: user.rankingAndRating,
    teamSizePreference: user.teamSizePreference,
    maxPlayersPerTeam: user.maxPlayersPerTeam,
    participationType: user.participationType,
    registrationLimit: user.registrationLimit,
    paymentMethod: user.paymentMethod,
    profileVisible: user.profileVisible,
    allowNotifications: user.allowNotifications,
    allowOrganizerRole: user.allowOrganizerRole,
  });
});

module.exports = {
  signupUser,
  verifyOTPUser,
  loginUser,
  getCurrentUser,
  updateUserProfile,
  upload,
  submitRoleChange,
  getRoleRequests,
  manageRoleRequest,
  forgotPassword,
  resetPassword,
  getOrganizers,
  getPlayers,
  getPlayerById,
};