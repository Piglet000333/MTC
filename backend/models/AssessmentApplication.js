const mongoose = require('mongoose');

const assessmentApplicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },
  status: { type: String, default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('AssessmentApplication', assessmentApplicationSchema);
