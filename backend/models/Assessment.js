const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  assessmentId: { 
    type: String, 
    required: [true, 'Assessment ID is required'], 
    unique: true,
    trim: true,
    uppercase: true,
    minlength: [2, 'Assessment ID must be at least 2 characters']
  },
  title: { 
    type: String, 
    required: [true, 'Assessment title is required'],
    trim: true,
    minlength: [3, 'Assessment title must be at least 3 characters']
  },
  fee: { 
    type: String,
    required: [true, 'Assessment fee is required'],
    trim: true
  },
  status: { 
    type: String,
    enum: ['Active', 'Inactive', 'Archived', 'Pending', 'Closed', 'Completed', 'Drop'],
    default: 'Active'
  },
  dropReason: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
