const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true }, // e.g., 'payment_config'
  value: { type: mongoose.Schema.Types.Mixed, required: true } // Can be object, string, etc.
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
