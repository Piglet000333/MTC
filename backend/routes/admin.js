const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');

// Helper to get or create the single admin user
const getAdmin = async () => {
  let admin = await Admin.findOne();
  if (!admin) {
    admin = await Admin.create({
      username: 'admin',
      password: 'admin123', // In a real app, hash this!
      image: ''
    });
  }
  return admin;
};

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    
    if (admin && admin.password === password) {
      res.json({ ok: true, username: admin.username, image: admin.image });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Profile
router.get('/profile', async (req, res) => {
  try {
    const admin = await getAdmin();
    res.json({
      username: admin.username,
      image: admin.image
      // Don't send password back
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile
router.put('/profile', async (req, res) => {
  try {
    const { username, password, image } = req.body;
    const admin = await getAdmin();

    if (username) admin.username = username;
    if (password) admin.password = password; // In real app, hash this
    if (image !== undefined) admin.image = image;

    await admin.save();

    res.json({
      ok: true,
      username: admin.username,
      image: admin.image
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
