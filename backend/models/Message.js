const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  senderRole: { type: String, enum: ['student', 'admin', 'bot'], required: true },
  text: { type: String, default: '' },
  isAuto: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  attachment: { type: String, default: null },
  hiddenForAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false })

module.exports = mongoose.model('Message', MessageSchema)
