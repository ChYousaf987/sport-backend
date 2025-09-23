// controllers/eventController.js
const Event = require('../models/CreateEventModel');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

// Configure multer for event media uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/events/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|gif/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed'));
};

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter 
});

const createEvent = async (req, res) => {
  try {
    console.log('createEvent - req.body:', req.body);
    console.log('createEvent - req.files:', req.files);

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
      userId,
      features,
    } = req.body;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: [{ field: 'userId', message: 'Invalid userId format' }],
      });
    }

    // Handle file uploads
    const mediaFiles = req.files ? req.files.map((file) => `/uploads/events/${file.filename}`) : [];

    // Parse array fields
    let rulesArray, featuresArray;
    try {
      rulesArray = typeof rules === 'string' ? JSON.parse(rules) : (Array.isArray(rules) ? rules : []);
      featuresArray = typeof features === 'string' ? JSON.parse(features) : (Array.isArray(features) ? features : []);
    } catch (err) {
      return res.status(400).json({
        message: 'Invalid JSON format for rules or features',
        errors: [{ field: 'rules/features', message: err.message }],
      });
    }

    // Parse date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: [{ field: 'date', message: 'Invalid date format' }],
      });
    }

    // Create event
    const event = new Event({
      userId,
      eventTitle,
      description,
      date: parsedDate,
      time,
      location,
      sport,
      organizerName,
      organizerGender,
      contactNumber1,
      contactNumber2: contactNumber2 || '',
      country,
      city,
      teamSizeLimit: parseInt(teamSizeLimit),
      maxPlayersPerTeam: parseInt(maxPlayersPerTeam),
      category,
      rules: rulesArray,
      type,
      registrationLimit: parseInt(registrationLimit),
      playerGender,
      age: parseInt(age),
      registrationFee: parseFloat(registrationFee),
      eventFeeMethod,
      features: featuresArray,
      media: mediaFiles,
    });

    await event.save();
    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    console.error('Event creation error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return res.status(400).json({
        message: 'Validation failed',
        errors,
      });
    }
    res.status(500).json({
      message: 'Server error',
      errors: [{ field: 'server', message: error.message }],
    });
  }
};

// Get all events
const getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('userId', 'fullName email');
    res.json(events);
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      errors: [{ field: 'server', message: error.message }],
    });
  }
};

// Get single event by ID
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid event ID format',
      });
    }

    const event = await Event.findById(id).populate('userId', 'fullName email');
    
    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      message: 'Server error',
      errors: [{ field: 'server', message: error.message }],
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('updateEvent - req.body:', req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid event ID format',
      });
    }

    const existingEvent = await Event.findById(id);
    if (!existingEvent) {
      return res.status(404).json({
        message: 'Event not found',
      });
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
      type,
      registrationLimit,
      playerGender,
      age,
      registrationFee,
      eventFeeMethod,
      userId,
    } = req.body;

    // Parse date
    let parsedDate = existingEvent.date;
    if (date) {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: [{ field: 'date', message: 'Invalid date format' }],
        });
      }
    }

    // Update event fields
    const updateData = {
      eventTitle: eventTitle || existingEvent.eventTitle,
      description: description || existingEvent.description,
      date: parsedDate,
      time: time || existingEvent.time,
      location: location || existingEvent.location,
      sport: sport || existingEvent.sport,
      organizerName: organizerName || existingEvent.organizerName,
      organizerGender: organizerGender || existingEvent.organizerGender,
      contactNumber1: contactNumber1 || existingEvent.contactNumber1,
      contactNumber2: contactNumber2 !== undefined ? contactNumber2 : existingEvent.contactNumber2,
      country: country || existingEvent.country,
      city: city || existingEvent.city,
      teamSizeLimit: teamSizeLimit ? parseInt(teamSizeLimit) : existingEvent.teamSizeLimit,
      maxPlayersPerTeam: maxPlayersPerTeam ? parseInt(maxPlayersPerTeam) : existingEvent.maxPlayersPerTeam,
      category: category || existingEvent.category,
      type: type || existingEvent.type,
      registrationLimit: registrationLimit ? parseInt(registrationLimit) : existingEvent.registrationLimit,
      playerGender: playerGender || existingEvent.playerGender,
      age: age ? parseInt(age) : existingEvent.age,
      registrationFee: registrationFee ? parseFloat(registrationFee) : existingEvent.registrationFee,
      eventFeeMethod: eventFeeMethod || existingEvent.eventFeeMethod,
    };

    // Handle file uploads if any
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map((file) => `/uploads/events/${file.filename}`);
      updateData.media = [...(existingEvent.media || []), ...newFiles];
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, { 
      new: true,
      runValidators: true 
    });

    res.json({ 
      message: 'Event updated successfully', 
      event: updatedEvent 
    });
  } catch (error) {
    console.error('Event update error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return res.status(400).json({
        message: 'Validation failed',
        errors,
      });
    }
    res.status(500).json({
      message: 'Server error',
      errors: [{ field: 'server', message: error.message }],
    });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid event ID format',
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    // Check if user has permission (optional)
    // const userId = req.body.userId || req.user?.id;
    // if (event.userId.toString() !== userId) {
    //   return res.status(403).json({ message: 'Unauthorized to delete this event' });
    // }

    await Event.findByIdAndDelete(id);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Event deletion error:', error);
    res.status(500).json({
      message: 'Server error',
      errors: [{ field: 'server', message: error.message }],
    });
  }
};

// Get organizer's events
const getOrganizerEvents = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: 'Invalid user ID format',
      });
    }

    const events = await Event.find({ userId }).populate('userId', 'fullName email');
    res.json(events);
  } catch (error) {
    console.error('Get organizer events error:', error);
    res.status(500).json({
      message: 'Server error',
      errors: [{ field: 'server', message: error.message }],
    });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getOrganizerEvents,
  upload,
};