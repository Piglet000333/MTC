const mongoose = require('mongoose');

const assessmentApplicationSchema = new mongoose.Schema({
  // Link to existing student account if available, but form data is primary
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, 
  
  // Personal & Background Info
  schoolCompany: { type: String, trim: true },
  address: { type: String, trim: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: [true, 'Assessment is required'] }, // The selected assessment
  assessmentTitle: String, // Store title for easier history
  
  name: {
    surname: { type: String, required: [true, 'Surname is required'], trim: true, minlength: [2, 'Surname must be at least 2 characters'] },
    firstname: { type: String, required: [true, 'Firstname is required'], trim: true, minlength: [2, 'Firstname must be at least 2 characters'] },
    middlename: { type: String, trim: true },
    middleInitial: { type: String, trim: true, maxlength: 5 }
  },
  
  mailingAddress: {
    numberStreet: String,
    barangay: String,
    district: String,
    city: String,
    province: String,
    region: String,
    zipCode: String
  },
  
  parents: {
    motherName: String,
    fatherName: String
  },
  
  sex: { type: String, enum: ['Male', 'Female'] },
  civilStatus: { type: String, enum: ['Single', 'Married', 'Widowed', 'Separated'] },
  
  contact: {
    email: { 
      type: String, 
      required: [true, 'Email is required'],
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
    },
    mobile: { 
      type: String,
      required: [true, 'Mobile number is required'],
      match: [/^\d{11}$/, 'Mobile number must be 11 digits']
    }
  },
  
  education: {
    attainment: {
      type: String,
      enum: {
        values: ['Elementary Graduate', 'High School Graduate', 'TVET Graduate', 'College Graduate', 'Others', '', null],
        message: '{VALUE} is not a valid education attainment'
      }
    }, // Elementary, High School, TVET, College, Others
    othersSpecification: String
  },
  
  employmentStatus: {
    type: String,
    enum: {
      values: ['Casual', 'Job Order', 'Probationary', 'Permanent', 'Self-Employed', 'OFW', '', null],
      message: '{VALUE} is not a valid employment status'
    }
  }, // Casual, Job Order, etc.
  
  birth: {
    date: { type: Date, required: [true, 'Birth date is required'] },
    place: String,
    age: { type: Number, min: [1, 'Age must be at least 1'] }
  },
  
  // Payment Info
  payment: {
    isOnline: { type: Boolean, default: false }, // true = Online, false = No
    senderGcashNumber: {
      type: String,
      validate: {
        validator: function(v) {
          if (this.payment && this.payment.isOnline) {
            return /^\d{11}$/.test(v);
          }
          return true;
        },
        message: 'Sender GCash number must be exactly 11 digits'
      }
    },
    referenceNumber: String,
    proofOfPayment: String // Base64 string of the image
  },
  
  status: { 
    type: String, 
    default: 'Pending',
    enum: ['Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled', 'Drop']
  }, // Pending, Approved, Rejected, Completed, Cancelled, Drop

  remarks: { type: String, trim: true } // Reason for Drop or other status changes
}, { timestamps: true });

// Prevent excess application over capacity - Removed (Unlimited)


module.exports = mongoose.model('AssessmentApplication', assessmentApplicationSchema);
