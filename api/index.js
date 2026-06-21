// Vercel looks for files inside /api as serverless function entry points.
// This simply re-exports our Express app — Vercel handles the HTTP server part.
const app = require('../server');

module.exports = app;
