const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { requireAdmin } = require('../middleware/auth');

// Helper to get or create the single admin user
const getAdmin = async () => {
  let admin = await Admin.findOne();
  if (!admin) {
    const username = process.env.ADMIN_BOOTSTRAP_USERNAME || 'admin';
    const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'admin123';
    admin = await Admin.create({
      username,
      password,
      image: ''
    });
  }
  return admin;
};

const isBcryptHash = (value) => typeof value === 'string' && /^\$2[aby]\$/.test(value);

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    await getAdmin();
    const admin = await Admin.findOne({ username });
    
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    let isMatch = false;
    if (isBcryptHash(admin.password)) {
      isMatch = await admin.comparePassword(password);
    } else {
      isMatch = admin.password === password;
      if (isMatch) {
        admin.password = password;
        await admin.save();
      }
    }

    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { sub: admin._id.toString(), role: 'admin' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    return res.json({ ok: true, token, username: admin.username, image: admin.image });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Profile
router.get('/profile', requireAdmin, async (req, res) => {
  try {
    const admin = req.admin;
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
router.put('/profile', requireAdmin, async (req, res) => {
  try {
    const { username, password, image } = req.body;
    const admin = req.admin;

    if (username) admin.username = username;
    if (password) admin.password = password;
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
