require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const contactRoutes = require('./routes/contact');
const chatRoutes = require('./routes/chat');
const reviewRoutes = require('./routes/reviews');

const app = express();

// ===== Middleware =====
app.use(express.json({ limit: '10kb' }));

// Allow both localhost and 127.0.0.1 (browsers treat them as different origins)
// for local development, plus whatever FRONTEND_URL is set to in production.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman, curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  methods: ['GET', 'POST'],
}));

// Rate limiting — prevents spam/abuse on contact + chat endpoints
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, error: 'Too many submissions. Please try again later.' }
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  message: { success: false, error: 'Too many messages. Please slow down a bit.' }
});

// ===== Routes =====
app.use('/api/contact', contactLimiter, contactRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/reviews', reviewRoutes); // rate limiting for POST is handled inside routes/reviews.js

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AK Dev Solutions backend is running.' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

// ===== Local development only =====
// On Vercel, this file is imported by api/index.js and the app is exported
// as a serverless handler instead of calling app.listen().
if (require.main === module) {
  connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
