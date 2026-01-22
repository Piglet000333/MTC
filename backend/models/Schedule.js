const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  courseId: { type: String, required: true, unique: true },
  courseTitle: { type: String, required: true },
  trainingDate: Date,
  capacity: Number,
  registered: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
