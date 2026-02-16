const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const {connectDB} = require('./db.js');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/students', require('./routes/students'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/assessment-applications', require('./routes/assessmentApplications'));
app.use('/api/system-settings', require('./routes/systemSettings'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/announcements', require('./routes/announcements'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running' });
});

const PORT = process.env.PORT || 5000;

// Export app for Vercel
module.exports = app;

// Connect to DB before listening (only if run directly)
if (require.main === module) {
  if (!process.env.MONGODB_URI) {
    console.error('FATAL ERROR: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  connectDB().then((connected) => {
    if (!connected) {
      console.error("❌ Failed to connect to DB. Server exiting...");
      process.exit(1);
    }
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  });
}
