const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// GET all announcements
// Query params: ?active=true to get only active ones
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    const query = {};
    if (active === 'true') {
        const today = new Date();
        query.isActive = true;
        query.publishDate = { $lte: today };
        query.$or = [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: { $gte: today } }
        ];
    }
    const announcements = await Announcement.find(query).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create announcement
router.post('/', async (req, res) => {
  const { title, content, priority, publishDate, expiryDate, category } = req.body;
  const announcement = new Announcement({
    title,
    content,
    priority,
    category,
    publishDate,
    expiryDate
  });

  try {
    const newAnnouncement = await announcement.save();
    res.status(201).json(newAnnouncement);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update announcement
router.put('/:id', async (req, res) => {
    try {
        const updated = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE announcement
router.delete('/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted Announcement' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
