const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  service: {
    type: String,
    enum: ['Landing Page / MVP', 'Full MERN Web App', 'AI-Integrated Platform', 'Something Custom'],
    default: 'Something Custom'
  },
  message: {
    type: String,
    required: [true, 'Project details are required'],
    trim: true,
    maxlength: 3000
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'closed'],
    default: 'new'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Contact', contactSchema);
