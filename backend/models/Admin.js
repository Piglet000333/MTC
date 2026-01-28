const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  password: {
    type: String,
    required: true,
    minlength: [6, 'Password must be at least 6 characters']
  },
  image: {
    type: String, // Base64 string for simplicity or URL
    default: '',
    trim: true
  }
});

module.exports = mongoose.model('Admin', adminSchema);
