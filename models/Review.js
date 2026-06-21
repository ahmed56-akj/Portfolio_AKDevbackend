const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  review: {
    type: String,
    required: [true, 'Review text is required'],
    trim: true,
    maxlength: 1000
  },
  role: {
    type: String,
    trim: true,
    maxlength: 100,
    default: ''
  },
  approved: {
    type: Boolean,
    default: true // set to false if you want manual approval before showing publicly
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', reviewSchema);
