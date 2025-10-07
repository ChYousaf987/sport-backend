const express = require("express");
const router = express.Router();
const {
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
  getPlayers,
  getCurrentPlayer, // Import the new function
} = require("../controllers/userController");

router.post("/signup", signupUser);
router.post("/verify-otp", verifyOTPUser);
router.post("/login", loginUser);
router.post("/me", getCurrentUser);
router.post("/update-profile", upload, updateUserProfile);
router.post("/submit-role-change", submitRoleChange);
router.post("/role-requests", getRoleRequests);
router.post("/manage-role-request", manageRoleRequest);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/organizers", getOrganizers);
router.post("/players", getPlayers);
router.post("/player", getPlayerById);


module.exports = router;