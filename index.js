require("dotenv").config();
const express = require("express");
const errorHandler = require("./middlewares/errorMiddleware");
const connectDB = require("./config/connectDB");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const contactRoutes = require("./routes/contactRoutes");
const eventRoutes = require("./routes/eventroutes");
const path = require("path");
const multer = require("multer");
require("colors");
const fs = require("fs");

// Ensure Uploads folder exists
const uploadsDir = path.join(__dirname, "Uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Log environment variables for debugging
console.log("Environment variables loaded:");
console.log("PORT:", process.env.PORT || "Not set");
console.log("MONGO_URL:", process.env.MONGO_URL ? "Set" : "Not set");
console.log("MAIL_USER:", process.env.MAIL_USER ? "Set" : "Not set");
console.log("MAIL_PASS:", process.env.MAIL_PASS ? "Set" : "Not set");

const app = express();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${ext}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (["image/jpeg", "image/jpg", "image/png"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, or .png files are allowed"), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Debug middleware to log incoming requests
app.use((req, res, next) => {
  console.log("Incoming request:", {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    file: req.file || "No file uploaded",
  });
  next();
});

// Static folder for uploads
app.use("/Uploads", express.static(path.join(__dirname, "Uploads")));

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