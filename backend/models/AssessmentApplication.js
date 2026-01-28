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
    enum: ['Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled']
  } // Pending, Approved, Rejected, Completed
}, { timestamps: true });

// Prevent excess application over capacity
assessmentApplicationSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Assessment = mongoose.model('Assessment');
      const assessment = await Assessment.findById(this.assessmentId);
      
      if (!assessment) {
        return next(new Error('Assessment not found'));
      }

      // If capacity is 0, it might mean unlimited or no capacity set. 
      // But user said "excess student should not override capacity".
      // Let's assume strict check. If capacity is 0, then 0 students allowed? 
      // Or 0 means unlimited?
      // Looking at Schedule model, capacity is required. 
      // Looking at Assessment model, capacity default is 0. 
      // If default is 0, usually that means "not set" or "full". 
      // However, usually "capacity" implies a limit. If it is 0, then limit is 0.
      // But if it's 0 by default, new assessments are created closed?
      // Let's check Assessment model again.
      
      // Assessment.js:
      // capacity: { type: Number, default: 0, min: [0, 'Capacity cannot be negative'] }
      
      // If I enforce >= capacity, and capacity is 0, then any application (count 0 >= 0) is rejected?
      // That would block all applications for default assessments.
      // I should probably check if capacity > 0.
      // Or maybe the user INTENDS for 0 to be closed.
      
      // Let's assume capacity > 0 check is safer for now unless user specified otherwise.
      // But "excess student should not override capacity" implies there IS a capacity.
      // If capacity is 0, and we have 0 students, is it excess?
      // Let's stick to strict interpretation: capacity is the limit. 
      // If capacity is 0, no one can apply. User can update capacity.
      
      // However, to be safe, I will allow if capacity is 0? No, that defeats the purpose if it defaults to 0.
      // Wait, if it defaults to 0, then newly created assessments (if user didn't set capacity) are closed.
      // That seems correct for an "Assessment" that might need setup.
      // BUT, let's look at `Schedule.js`. Required capacity.
      // `Assessment.js`. Capacity default 0.
      
      // Let's check how `Assessment` is created in `AdminDashboard.jsx` or similar.
      // In the previous turn, I saw the modal for Assessment has a Capacity input.
      // So the user sets it.
      
      const count = await this.constructor.countDocuments({
        assessmentId: this.assessmentId,
        status: { $nin: ['Rejected', 'Cancelled'] }
      });

      if (count >= assessment.capacity) {
        return next(new Error('Assessment is full. Capacity reached.'));
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('AssessmentApplication', assessmentApplicationSchema);
