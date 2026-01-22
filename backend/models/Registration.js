const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true },
    termsAccepted: { type: Boolean, default: false },
    status: { type: String, default: 'active' }, // active, cancelled
    cancelledAt: { type: Date }
  },
  { timestamps: true }
);

registrationSchema.index({ studentId: 1, scheduleId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
