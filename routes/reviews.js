const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Review = require('../models/Review');
const connectDB = require('../config/db');

// Rate limit only applies to submitting reviews (POST), not fetching them (GET)
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, error: 'Too many reviews submitted. Please try again later.' }
});

// POST /api/reviews — submit a new client review
router.post('/', submitLimiter, async (req, res) => {
  try {
    await connectDB(); // ensures DB connection in serverless environment

    const { name, rating, review, role } = req.body;

    if (!name || !rating || !review) {
      return res.status(400).json({
        success: false,
        error: 'Name, rating, and review text are required.'
      });
    }

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be a whole number between 1 and 5.'
      });
    }

    const newReview = await Review.create({
      name,
      rating: numericRating,
      review,
      role: role || ''
    });

    res.status(201).json({
      success: true,
      message: 'Thanks for your review!',
      data: newReview
    });

  } catch (err) {
    console.error('Review submit error:', err.message);

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }

    res.status(500).json({
      success: false,
      error: 'Something went wrong submitting your review. Please try again.'
    });
  }
});

// GET /api/reviews — fetch latest approved reviews (for displaying on the site)
router.get('/', async (req, res) => {
  try {
    await connectDB();

    const reviews = await Review.find({ approved: true })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, data: reviews });

  } catch (err) {
    console.error('Review fetch error:', err.message);
    res.status(500).json({ success: false, error: 'Could not load reviews.' });
  }
});

module.exports = router;
