
const User = require("../models/userModel");
const RoleRequest = require("../models/roleRequestModel");
const asyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt"); // Added for resetPassword

// Multer configuration for profile image
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "Uploads/profile";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const userId = req.body.userId || 'user';
    cb(null, `${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png/;
  const extname = fileTypes.test(path.extname(file.originalName).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("Only images (jpeg, jpg, png) are allowed"));
};

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter,
}).single("profileImage");

// Validate environment variables
if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
  console.error(
    "Missing email credentials: MAIL_USER or MAIL_PASS is undefined"
  );
  throw new Error("Server configuration error: Email credentials missing");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Nodemailer configuration error:", error.message);
  } else {
    console.log("Nodemailer is ready to send emails");
  }
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const signupUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, location, gender, age } = req.body;

  if (!fullName || !email || !password || !location || !gender || !age) {
    res.status(400);
    throw new Error("All fields are required");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const otp = generateOTP();

  let user;
  try {
    user = await User.create({
      fullName,
      email,
      password,
      location,
      gender,
      age,
      otp,
    });
  } catch (error) {
    console.error("User creation error:", error.message);
    res.status(500);
    throw new Error("Failed to create user. Please try again.");
  }

  const mailOptions = {
    from: `"Sports App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Your OTP for Account Verification",
    text: `Hello ${fullName},\n\nYour OTP for account verification is: ${otp}\n\nPlease enter this OTP to verify your account within 10 minutes.\n\nThank you,\nSports App Team`,
    html: `
      <h2>Hello ${fullName},</h2>
      <p>Your OTP for account verification is: <strong>${otp}</strong></p>
      <p>Please enter this OTP to verify your account within 10 minutes.</p>
      <p>Thank you,<br>Sports App Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}: ${otp}`);
  } catch (error) {
    console.error("Email sending error:", error.message);
    await User.deleteOne({ _id: user._id });
    res.status(500);
    throw new Error(
      `Failed to send OTP: ${error.message}. Please check your email and try again.`
    );
  }

  res.status(201).json({
    message: "User registered. Please verify OTP sent to your email.",
    userId: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  });
});

const verifyOTPUser = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    res.status(400);
    throw new Error("User ID and OTP are required");
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error("User already verified");
  }

  if (user.otp !== otp) {
    res.status(400);
    throw new Error("Invalid OTP");
  }

  user.isVerified = true;
  user.otp = null;
  await user.save();

  res.status(200).json({
    message: "OTP verified successfully",
    userId: user._id,
    user: {
      fullName: user.fullName,
      email: user.email,
      location: user.location,
      gender: user.gender,
      age: user.age,
      role: user.role,
    },
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isVerified) {
    res.status(403);
    throw new Error("Please verify your email with OTP");
  }

  if (!(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.status(200).json({
    message: "Login successful",
    userId: user._id,
    user: {
      fullName: user.fullName,
      email: user.email,
      location: user.location,
      gender: user.gender,
      age: user.age,
      role: user.role,
    },
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
      country
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

    // Update fields if provided
    if (fullName !== undefined) user.fullName = fullName.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();
    if (location !== undefined) user.location = location.trim();
    if (country !== undefined) user.country = country.trim();
    if (gender !== undefined) user.gender = gender;
    if (age !== undefined) user.age = parseInt(age);
    if (description !== undefined) user.description = description.trim();
    
    // Handle profile image upload
    if (req.file) {
      console.log('Profile image uploaded:', req.file.path);
      user.profileImage = req.file.path;
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
        profileImage: user.profileImage ? `/${user.profileImage}` : null,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    // Clean up uploaded file if there's an error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('Cleaned up failed upload:', req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500);
    throw new Error(`Profile update failed: ${error.message}`);
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
    profileImage: user.profileImage ? `/${user.profileImage}` : null,
    role: user.role,
  });
});

const getCurrentPlayer = asyncHandler(async (req, res) => {
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
    throw new Error("Player not found");
  }

  if (user.role !== "user") {
    res.status(400);
    throw new Error("User is not a player");
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
    profileImage: user.profileImage ? `/${user.profileImage}` : null,
    role: user.role,
  });
});

const submitRoleChange = asyncHandler(async (req, res) => {
  const {
    userId,
    fullName,
    email,
    phoneNumber1,
    phoneNumber2,
    organizerType,
    city,
    region,
    address,
    sports,
    eventTypes,
    bankName,
    accountNumber,
  } = req.body;

  const missingFields = [];
  if (!userId) missingFields.push("User ID");
  if (!fullName) missingFields.push("Full Name");
  if (!email) missingFields.push("Email");
  if (!phoneNumber1) missingFields.push("Primary Phone Number");
  if (!phoneNumber2) missingFields.push("Secondary Phone Number");
  if (!organizerType) missingFields.push("Organizer Type");
  if (!city) missingFields.push("City");
  if (!region) missingFields.push("Region");
  if (!address) missingFields.push("Address");
  if (!sports || sports.length === 0) missingFields.push("Sports");
  if (!eventTypes || eventTypes.length === 0) missingFields.push("Event Types");
  if (!bankName) missingFields.push("Bank Name");
  if (!accountNumber) missingFields.push("Account Number");

  if (missingFields.length > 0) {
    res.status(400);
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!user.isVerified) {
    res.status(403);
    throw new Error("User must be verified to request role change");
  }

  const existingRequest = await RoleRequest.findOne({
    userId,
    status: "pending",
  });
  if (existingRequest) {
    res.status(400);
    throw new Error("A pending role change request already exists");
  }

  const roleRequest = await RoleRequest.create({
    userId,
    fullName,
    email,
    phoneNumber1,
    phoneNumber2,
    organizerType,
    city,
    region,
    address,
    sports,
    eventTypes,
    bankName,
    accountNumber,
  });

  const mailOptions = {
    from: `"Sports App" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_USER,
    subject: `New Role Change Request from ${fullName}`,
    html: `
      <h2>New Role Change Request</h2>
      <p><strong>User ID:</strong> ${userId}</p>
      <p><strong>Full Name:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone Number 1:</strong> ${phoneNumber1}</p>
      <p><strong>Phone Number 2:</strong> ${phoneNumber2}</p>
      <p><strong>Organizer Type:</strong> ${organizerType}</p>
      <p><strong>City:</strong> ${city}</p>
      <p><strong>Region:</strong> ${region}</p>
      <p><strong>Address:</strong> ${address}</p>
      <p><strong>Sports:</strong> ${sports.join(", ")}</p>
      <p><strong>Event Types:</strong> ${eventTypes.join(", ")}</p>
      <p><strong>Bank Name:</strong> ${bankName}</p>
      <p><strong>Account Number:</strong> ${accountNumber}</p>
      <p>Please review and approve or reject this request in the admin panel.</p>
    `,
  };

  await transporter.sendMail(mailOptions);

  res.status(201).json({
    message: "Role change request submitted successfully",
    requestId: roleRequest._id,
  });
});

const getRoleRequests = asyncHandler(async (req, res) => {
  const roleRequests = await RoleRequest.find().populate(
    "userId",
    "fullName email role"
  );
  res.status(200).json(roleRequests);
});

const manageRoleRequest = asyncHandler(async (req, res) => {
  const { requestId, action } = req.body;

  if (!requestId || !["approve", "reject"].includes(action)) {
    res.status(400);
    throw new Error(
      "Request ID and valid action (approve/reject) are required"
    );
  }

  const roleRequest = await RoleRequest.findById(requestId);
  if (!roleRequest) {
    res.status(404);
    throw new Error("Role request not found");
  }

  if (roleRequest.status !== "pending") {
    res.status(400);
    throw new Error("Request has already been processed");
  }

  if (action === "approve") {
    const user = await User.findById(roleRequest.userId);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    user.role = "organizer";
    await user.save();
    roleRequest.status = "approved";
  } else {
    roleRequest.status = "rejected";
  }

  await roleRequest.save();

  const mailOptions = {
    from: `"Sports App" <${process.env.MAIL_USER}>`,
    to: roleRequest.email,
    subject: `Role Change Request ${
      action === "approve" ? "Approved" : "Rejected"
    }`,
    html: `
      <h2>Role Change Request Update</h2>
      <p>Hello ${roleRequest.fullName},</p>
      <p>Your request to change your role to organizer has been <strong>${
        action === "approve" ? "approved" : "rejected"
      }</strong>.</p>
      ${
        action === "approve"
          ? "<p>You can now access organizer features in the Sports App.</p>"
          : "<p>Please contact support for more details.</p>"
      }
      <p>Thank you,<br>Sports App Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);

  res.status(200).json({
    message: `Role change request ${action}d successfully`,
    requestId: roleRequest._id,
    userId: roleRequest.userId,
    role: action === "approve" ? "organizer" : roleRequest.userId.role,
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  console.log("Forgot password request received for email:", email);

  if (!email) {
    console.log("Forgot password error: Email is missing");
    res.status(400);
    throw new Error("Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    console.log("Forgot password: User not found for email:", email);
    res.status(200).json({
      message:
        "If your email is registered, you will receive password reset instructions",
    });
    return;
  }

  console.log("User found, generating reset token for:", email);

  const resetToken = generateOTP();
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  console.log("Reset token generated and saved:", resetToken);

  const mailOptions = {
    from: `"Sports App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Password Reset Instructions",
    html: `
      <h2>Hello ${user.fullName},</h2>
      <p>You requested a password reset. Please use the following code to reset your password:</p>
      <h3 style="color: #E45352; font-size: 24px;">${resetToken}</h3>
      <p>This code will expire in 1 hour.</p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <p>Thank you,<br>Sports App Team</p>
    `,
  };

  try {
    console.log("Attempting to send reset email to:", email);
    await transporter.sendMail(mailOptions);
    console.log("Reset email sent successfully to:", email);

    res.status(200).json({
      message: "Password reset instructions sent to your email",
      email: email,
    });
  } catch (error) {
    console.error("Email sending error:", error.message);
    res.status(500);
    throw new Error(
      `Failed to send password reset email: ${error.message}. Please try again.`
    );
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, newPassword } = req.body;

  console.log(`Reset password attempt for email: ${email}`);

  if (!email || !token || !newPassword) {
    console.log("Missing required fields:", {
      email: !!email,
      token: !!token,
      newPassword: !!newPassword,
    });
    res.status(400);
    throw new Error("Email, reset token, and new password are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    console.log(`User not found with email: ${email}`);
    res.status(404);
    throw new Error("User not found");
  }

  console.log(
    `User found. Checking token. User token: ${user.resetPasswordToken}, Provided token: ${token}`
  );

  if (!user.resetPasswordToken || !user.resetPasswordExpires) {
    console.log("No reset token found for user");
    res.status(400);
    throw new Error("Token not found. Please request a new password reset.");
  }

  if (user.resetPasswordToken !== token) {
    console.log("Token mismatch:", {
      userToken: user.resetPasswordToken,
      providedToken: token,
    });
    res.status(400);
    throw new Error("Invalid token. Please check and try again.");
  }

  if (user.resetPasswordExpires < Date.now()) {
    console.log("Token expired. Expiry:", new Date(user.resetPasswordExpires));
    res.status(400);
    throw new Error("Token has expired. Please request a new password reset.");
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  console.log("Password updated successfully for user:", email);

  const mailOptions = {
    from: `"Sports App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Password Reset Successful",
    html: `
      <h2>Hello ${user.fullName},</h2>
      <p>Your password has been successfully reset.</p>
      <p>If you did not request this change, please contact us immediately.</p>
      <p>Thank you,<br>Sports App Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);

  res.status(200).json({
    message: "Password has been reset successfully",
  });
});

const getOrganizers = asyncHandler(async (req, res) => {
  const organizers = await User.find({ role: "organizer" }).select(
    "fullName email location country gender age description profileImage role"
  );
  if (!organizers || organizers.length === 0) {
    res.status(404);
    throw new Error("No organizers found");
  }

  const formattedOrganizers = organizers.map((user) => ({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    location: user.location,
    country: user.country,
    gender: user.gender,
    age: user.age,
    description: user.description,
    profileImage: user.profileImage ? `/${user.profileImage}` : null,
    role: user.role,
  }));

  res.status(200).json(formattedOrganizers);
});

const getPlayers = asyncHandler(async (req, res) => {
  const players = await User.find({ role: "user" }).select(
    "fullName email location country gender age description profileImage role"
  );
  console.log('Players found:', players); // Debug log
  if (!players || players.length === 0) {
    res.status(404);
    throw new Error("No players found");
  }
  const formattedPlayers = players.map((user) => ({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    location: user.location,
    country: user.country,
    gender: user.gender,
    age: user.age,
    description: user.description,
    profileImage: user.profileImage ? `/${user.profileImage}` : null,
    role: user.role,
  }));
  res.status(200).json(formattedPlayers);
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
  getCurrentPlayer, // Added to exports
};