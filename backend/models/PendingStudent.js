const mongoose = require('mongoose');

const pendingStudentSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  middleName: { type: String, trim: true },
  email: { 
    type: String, 
    required: true, 
    trim: true,
    lowercase: true,
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: 'Invalid email format'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  mobileNo: {
    type: String,
    trim: true,
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
    required: [true, 'Age is required'],
    min: [1, 'Age must be at least 1']
  },
  
  // Education
  educationCollege: { type: String },
  educationCourse: { type: String },

  // Employment
  employmentCompany: { type: String },
  employmentPosition: { type: String },
  employmentDepartment: { type: String },
  employmentStatus: { 
    type: String,
    enum: {
      values: ['Regular', 'Contractual', 'Part-time', 'Self-employed', '', null],
      message: '{VALUE} is not a valid employment status'
    }
  },
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
  ojtAddress: { type: String },

  // Specialization
  areaOfSpecialization: { type: String },
  otherSpecification: { type: String },
  
  // Profile
  profilePicture: { type: String }, // Base64 or URL

  // Account Verification
  verificationCode: { 
    type: String,
    required: true
  },

  // Auto-expire after 1 hour (3600 seconds)
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 3600 
  }

});

module.exports = mongoose.model('PendingStudent', pendingStudentSchema);
