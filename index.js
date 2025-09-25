require("dotenv").config();
const express = require("express");
const errorHandler = require("./middlewares/errorMiddleware");
const connectDB = require("./config/connectDB");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const contactRoutes = require("./routes/contactRoutes");
const eventRoutes = require("./routes/eventroutes");
const path = require("path");
require("colors");

// Log environment variables for debugging
console.log("Environment variables loaded:");
console.log("PORT:", process.env.PORT || "Not set");
console.log("MONGO_URL:", process.env.MONGO_URL ? "Set" : "Not set");
console.log("MAIL_USER:", process.env.MAIL_USER ? "Set" : "Not set");
console.log("MAIL_PASS:", process.env.MAIL_PASS ? "Set" : "Not set");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static folder for uploads
app.use("/Uploads", express.static(path.join(__dirname, "Uploads"))); // Changed to /Uploads

// Routes
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/events", eventRoutes);

// Default route for testing
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

// Error handler middleware (should be last)
app.use(errorHandler);

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`Server started on port:${PORT.toString().yellow}`)
);