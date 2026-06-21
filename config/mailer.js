const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Verify connection on startup (logs a warning, doesn't crash the server)
transporter.verify((err) => {
  if (err) {
    console.warn('⚠️  Email transporter not ready:', err.message);
    console.warn('   Check GMAIL_USER and GMAIL_APP_PASSWORD in your .env file.');
  } else {
    console.log('✅ Email transporter ready');
  }
});

module.exports = transporter;
