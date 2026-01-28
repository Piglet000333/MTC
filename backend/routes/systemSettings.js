const express = require('express');
const router = express.Router();
const SystemSettings = require('../models/SystemSettings');

// Get settings by key
router.get('/:key', async (req, res) => {
  try {
    const setting = await SystemSettings.findOne({ key: req.params.key });
    if (!setting) {
      // Return default if not found
      if (req.params.key === 'payment_config') {
        return res.json({
          key: 'payment_config',
          value: {
            gcashNumber: '0917-123-4567',
            qrCodeImage: '' // Base64 string
          }
        });
      }
      return res.status(404).json({ message: 'Settings not found' });
    }
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings
router.put('/:key', async (req, res) => {
  try {
    const setting = await SystemSettings.findOneAndUpdate(
      { key: req.params.key },
      { value: req.body.value },
      { new: true, upsert: true } // Create if not exists
    );
    res.json(setting);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
