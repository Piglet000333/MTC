const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true },
    termsAccepted: { type: Boolean, default: false, required: true },
    status: { 
      type: String, 
      default: 'pending',
      enum: ['active', 'cancelled', 'completed', 'pending', 'dropped', 'rejected'] 
    }, // active, cancelled, completed, pending, dropped, rejected
    
    // Payment Info
    payment: {
      isOnline: { type: Boolean, default: false }, // true = Online, false = No/On-site
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

    remarks: { type: String, trim: true }, // Reason for cancellation or other status changes
    cancelledAt: { type: Date },
    rejectionCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

registrationSchema.index({ studentId: 1, scheduleId: 1 }, { unique: true });

// Prevent excess registration over capacity
registrationSchema.pre('save', async function() {
  if (this.status) {
    this.status = String(this.status).toLowerCase();
  }
  if (this.isNew) {
    const Schedule = mongoose.model('Schedule');
    const schedule = await Schedule.findById(this.scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }
    const count = await this.constructor.countDocuments({
      scheduleId: this.scheduleId,
      status: { $in: ['active', 'pending'] }
    });
    if (count >= schedule.capacity) {
      throw new Error('Schedule is full. Capacity reached.');
    }
  }
});

module.exports = mongoose.model('Registration', registrationSchema);
