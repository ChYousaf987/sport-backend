// middleware/uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure storage for general uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and JPG files are allowed"), false);
  }
};

// Initialize Multer for single file
const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
});

// For event media uploads
const eventStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/events/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `media-${Date.now()}-${file.originalname}`);
  },
});

const eventUpload = multer({
  storage: eventStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/mpeg'];
    if (validTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
}).array('media', 10);

module.exports = {
  uploadSingle,
  eventUpload,
  eventUploadMiddleware: (req, res, next) => {
    eventUpload(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      console.log('uploadMiddleware - req.files:', req.files);
      console.log('uploadMiddleware - req.body:', req.body);
      next();
    });
  }
};