const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
  category: { type: String, enum: ['Academic', 'Facilities', 'Assessment', 'Events', 'Health & Safety', 'Administrative'], required: true },
  isActive: { type: Boolean, default: true },
  publishDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', announcementSchema);
