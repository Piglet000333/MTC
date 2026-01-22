const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  assessmentId: { type: String, required: true, unique: true },
  title: String,
  fee: String,
  status: String
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
