const asyncHandler = require("express-async-handler");
const Contact = require("../models/contactModel");
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const submitContactForm = asyncHandler(async (req, res) => {
  const { name, phoneNumber, city, message } = req.body;

  if (!name || !phoneNumber || !city || !message) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }

  // Save to MongoDB
  const contact = await Contact.create({
    name,
    phoneNumber,
    city,
    message,
  });

  // Send email
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: process.env.MAIL_USER,
    subject: `New Contact Form Submission from ${name}`,
    html: `
      <h3>New Contact Form Submission</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Phone Number:</strong> ${phoneNumber}</p>
      <p><strong>City:</strong> ${city}</p>
      <p><strong>Message:</strong> ${message}</p>
    `,
  };

  await transporter.sendMail(mailOptions);

  res.status(201).json({
    success: true,
    data: contact,
    message: "Form submitted successfully",
  });
});

module.exports = { submitContactForm };
