const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true },
    termsAccepted: { type: Boolean, default: false, required: true },
    status: { 
      type: String, 
      default: 'active',
      enum: ['active', 'cancelled', 'completed'] 
    }, // active, cancelled, completed
    cancelledAt: { type: Date }
  },
  { timestamps: true }
);

registrationSchema.index({ studentId: 1, scheduleId: 1 }, { unique: true });

// Prevent excess registration over capacity
registrationSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Schedule = mongoose.model('Schedule');
      const schedule = await Schedule.findById(this.scheduleId);
      
      if (!schedule) {
        return next(new Error('Schedule not found'));
      }

      const count = await this.constructor.countDocuments({
        scheduleId: this.scheduleId,
        status: { $ne: 'cancelled' }
      });

      if (count >= schedule.capacity) {
        return next(new Error('Schedule is full. Capacity reached.'));
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Registration', registrationSchema);
