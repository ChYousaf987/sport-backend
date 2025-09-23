// controllers/eventController.js
const asyncHandler = require("express-async-handler");
const Event = require("../models/eventModel");
const User = require("../models/userModel");
const multer = require("multer");
const path = require("path");

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|mp4/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("Only images (jpeg, jpg, png) and videos (mp4) are allowed"));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
}).array("media", 5);

const createEvent = asyncHandler(async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      res.status(400);
      throw new Error(err.message);
    }

    const {
      eventTitle,
      description,
      date,
      time,
      location,
      sport,
      organizerName,
      organizerGender,
      contactNumber1,
      contactNumber2,
      country,
      city,
      teamSizeLimit,
      maxPlayersPerTeam,
      category,
      rules,
      type,
      registrationLimit,
      playerGender,
      age,
      registrationFee,
      eventFeeMethod,
      features,
    } = req.body;
    const userId = req.body.userId;

    console.log("Received event data:", { date, time }); // Debug log

    if (!userId) {
      res.status(400);
      throw new Error("User ID is required");
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (user.role !== "organizer") {
      res.status(403);
      throw new Error("Only organizers can create events");
    }

    // Validate date and time
    if (!date || !time) {
      res.status(400);
      throw new Error("Date and time are required");
    }

    // Construct date in UTC to avoid time zone issues
    const eventDateTime = new Date(`${date}T${time}:00Z`);
    if (isNaN(eventDateTime.getTime())) {
      res.status(400);
      throw new Error("Invalid date or time format");
    }

    // Compare with current UTC time
    const now = new Date();
    if (eventDateTime < now) {
      res.status(400);
      throw new Error("Event date and time cannot be in the past");
    }

    const mediaPaths = req.files ? req.files.map((file) => file.path) : [];

    const event = await Event.create({
      userId,
      eventTitle,
      description,
      date: eventDateTime,
      time,
      location,
      sport,
      organizerName,
      organizerGender,
      contactNumber1,
      contactNumber2,
      country,
      city,
      teamSizeLimit: parseInt(teamSizeLimit),
      maxPlayersPerTeam: parseInt(maxPlayersPerTeam),
      category,
      rules: JSON.parse(rules || "[]"),
      type,
      registrationLimit: parseInt(registrationLimit),
      playerGender,
      age: parseInt(age),
      registrationFee: parseFloat(registrationFee),
      eventFeeMethod,
      features: JSON.parse(features || "[]"),
      media: mediaPaths,
    });

    res.status(201).json({
      message: "Event created successfully",
      eventId: event._id,
      event: {
        eventTitle: event.eventTitle,
        date: event.date,
        location: event.location,
        media: event.media,
      },
    });
  });
});

const getOrganizerEvents = asyncHandler(async (req, res) => {
  const { userId, query } = req.body;

  if (!userId) {
    res.status(400);
    throw new Error("User ID is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.role !== "organizer") {
    res.status(403);
    throw new Error("Only organizers can view events");
  }

  const currentDate = new Date();
  const searchCriteria = {
    userId,
    ...(query && {
      $or: [
        { eventTitle: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
      ],
    }),
  };

  const upcomingEvents = await Event.find({
    ...searchCriteria,
    date: { $gte: currentDate },
    isCompleted: false,
  })
    .select("eventTitle location date time description participants media")
    .populate("participants", "fullName");

  const pastEvents = await Event.find({
    ...searchCriteria,
    date: { $lt: currentDate },
    isCompleted: true,
  })
    .select("eventTitle location date time description participants media")
    .populate("participants", "fullName");

  res.status(200).json({
    upcomingEvents,
    pastEvents,
  });
});

module.exports = {
  createEvent,
  getOrganizerEvents,
};
