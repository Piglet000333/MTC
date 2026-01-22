const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const {connectDB} = require('./db.js');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/students', require('./routes/students'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/registrations', require('./routes/registrations'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running' });
});

const PORT = process.env.PORT || 5000;

// Connect to DB before listening
connectDB().then((connected) => {
  if (!connected) {
    console.error("❌ Failed to connect to DB. Server exiting...");
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
