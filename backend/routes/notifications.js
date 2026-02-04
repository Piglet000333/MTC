const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { requireAdmin, requireStudentOrAdmin } = require('../middleware/auth');

// Get notifications for the logged-in student
router.get('/student', requireStudentOrAdmin, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const notifications = await Notification.find({ studentId: userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unread count for student
router.get('/student/unread-count', requireStudentOrAdmin, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const count = await Notification.countDocuments({ studentId: userId, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark student notification as read
router.put('/student/:id/read', requireStudentOrAdmin, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, studentId: userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mark all student notifications as read
router.put('/student/read-all', requireStudentOrAdmin, async (req, res) => {
  try {
    const userId = req.auth.userId;
    await Notification.updateMany(
      { studentId: userId, isRead: false },
      { isRead: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a specific notification
router.delete('/student/:id', requireStudentOrAdmin, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, studentId: userId });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete all notifications for student
router.delete('/student/all', requireStudentOrAdmin, async (req, res) => {
  try {
    const userId = req.auth.userId;
    await Notification.deleteMany({ studentId: userId });
    res.json({ message: 'All notifications deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// --- Admin Routes ---

// Get all notifications (sorted by newest)
router.get('/', requireAdmin, async (req, res) => {
  try {
    // Admin should see system notifications, but not personal student messages
    const notifications = await Notification.find({
      $or: [
        { studentId: { $exists: false } },
        { studentId: null }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 notifications
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unread count
router.get('/unread-count', requireAdmin, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ isRead: false }); // Admin sees all unread? Or maybe filtered. Keeping original logic.
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark as read
router.put('/:id/read', requireAdmin, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json(notification);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mark all as read
router.put('/read-all', requireAdmin, async (req, res) => {
  try {
    await Notification.updateMany(
      { isRead: false },
      { isRead: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete all notifications
router.delete('/delete-all', requireAdmin, async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete notification
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
