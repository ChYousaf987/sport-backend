// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const {
  signupUser,
  verifyOTPUser,
  loginUser,
  getCurrentUser,
  updateUserProfile,
  upload, // Import the upload middleware
  submitRoleChange,
  getRoleRequests,
  manageRoleRequest,
  forgotPassword,
  resetPassword,
  getOrganizers,
} = require("../controllers/userController");

// Apply multer middleware to the update-profile route
router.post("/update-profile", upload, updateUserProfile);

router.post("/signup", signupUser);
router.post("/verify-otp", verifyOTPUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/me", getCurrentUser);
router.post("/role-change", submitRoleChange);
router.get("/role-requests", getRoleRequests);
router.post("/manage-role-request", manageRoleRequest)
router.get("/organizers", getOrganizers);



module.exports = router;