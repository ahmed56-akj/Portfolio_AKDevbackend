const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const transporter = require('../config/mailer');
const connectDB = require('../config/db');

// POST /api/contact — handle contact form submission
router.post('/', async (req, res) => {
  try {
    await connectDB(); // ensures DB connection in serverless environment

    const { name, email, service, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and message are required.'
      });
    }

    // 1. Save to MongoDB
    const contact = await Contact.create({ name, email, service, message });

    // 2. Email notification to Ahmed (admin)
    const adminMailOptions = {
      from: `"AK Dev Solutions Website" <${process.env.GMAIL_USER}>`,
      to: process.env.NOTIFY_EMAIL,
      subject: `📩 New Inquiry: ${service || 'General'} — from ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: auto;">
          <h2 style="color:#d4af37;">New Contact Form Submission</h2>
          <table style="width:100%; border-collapse: collapse;">
            <tr><td style="padding:8px; font-weight:bold;">Name</td><td style="padding:8px;">${name}</td></tr>
            <tr><td style="padding:8px; font-weight:bold;">Email</td><td style="padding:8px;">${email}</td></tr>
            <tr><td style="padding:8px; font-weight:bold;">Service</td><td style="padding:8px;">${service || 'Not specified'}</td></tr>
          </table>
          <p style="margin-top:16px;"><strong>Message:</strong></p>
          <p style="background:#f4f4f4; padding:14px; border-radius:8px;">${message.replace(/\n/g, '<br>')}</p>
          <p style="color:#888; font-size:12px; margin-top:20px;">Submitted at ${new Date(contact.createdAt).toLocaleString()}</p>
        </div>
      `
    };

    // 3. Auto-reply email to the client
    const clientMailOptions = {
      from: `"Ahmed Khan — AK Dev Solutions" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Thanks for reaching out, ${name}! 🚀`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: auto;">
          <h2 style="color:#d4af37;">Got your message!</h2>
          <p>Hi ${name},</p>
          <p>Thanks for reaching out to <strong>AK Dev Solutions</strong>. I've received your inquiry about
          <strong>${service || 'your project'}</strong> and will get back to you within a few hours.</p>
          <p>In the meantime, feel free to check out my work or reach me directly on WhatsApp if it's urgent.</p>
          <br>
          <p>Best,<br><strong>Ahmed Khan</strong><br>AK Dev Solutions</p>
        </div>
      `
    };

    // Send both emails (don't block the response on email — but await so we know if it failed)
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(clientMailOptions)
    ]);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully! Check your email for confirmation.'
    });

  } catch (err) {
    console.error('Contact route error:', err.message);

    // Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }

    res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again or contact via WhatsApp.'
    });
  }
});

module.exports = router;
