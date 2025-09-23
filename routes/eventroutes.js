// routes/eventroutes.js
const express = require("express");
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getOrganizerEvents,
  upload,
} = require("../controllers/CreateeventController");

// Create event (with file upload)
router.post("/create-event", upload.array("media", 5), createEvent);

// Get all events
router.get("/events", getEvents);

// Get single event by ID
router.get("/events/:id", getEventById);

// Update event (with optional file upload)
router.put("/events/:id", upload.array("media", 5), updateEvent);

// Delete event
router.delete("/events/:id", deleteEvent);

// Get organizer's events
router.post("/organizer-events", getOrganizerEvents);

module.exports = router;