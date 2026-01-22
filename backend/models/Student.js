const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  middleName: { type: String },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: 'Invalid email format'
    }
  },
  mobileNo: {
    type: String,
    validate: {
      validator: (v) => !v || /^\d{11}$/.test(v),
      message: 'Mobile number must be exactly 11 digits'
    }
  },
  telephoneNo: {
    type: String,
    maxlength: 20
  },
  dateOfBirth: { type: Date },
  completeAddress: { type: String },
  sex: { type: String },
  civilStatus: { type: String },
  nationality: { type: String },
  religion: { type: String },
  age: {
    type: Number,
    min: [1, 'Age must be at least 1']
  },
  
  // Education
  educationCollege: { type: String },
  educationCourse: { type: String },

  // Employment
  employmentCompany: { type: String },
  employmentPosition: { type: String },
  employmentDepartment: { type: String },
  employmentStatus: { type: String },
  employmentDate: { type: Date },
  yearsOfExperience: {
    type: Number,
    min: [0, 'Years of experience cannot be negative'],
    default: 0
  },
  employmentReferences: { type: String },

  // OJT
  ojtIndustry: { type: String },
  ojtCompany: { type: String },
  ojtAddress: { type: String }

}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
