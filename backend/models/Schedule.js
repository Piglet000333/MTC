const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  courseId: { 
    type: String, 
    required: [true, 'Enter Course ID'], 
    unique: true,
    trim: true,
    uppercase: true,
    minlength: [2, 'Course ID must be at least 2 characters']
  },
  courseTitle: { 
    type: String, 
    required: [true, 'Enter Course Title'],
    trim: true,
    minlength: [3, 'Course Title must be at least 3 characters']
  },
  trainingDate: { 
    type: Date, 
    required: [true, 'Enter Training Date'] 
  },
  capacity: { 
    type: Number, 
    required: [true, 'Enter Capacity'],
    min: [0, 'Capacity cannot be negative']
  },
  price: {
    type: Number,
    required: [true, 'Enter Price'],
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  registered: { 
    type: Number, 
    default: 0,
    min: [0, 'Registered count cannot be negative']
  },
  status: {
    type: String,
    enum: ['Active', 'Pending', 'Closed'],
    default: 'Active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
