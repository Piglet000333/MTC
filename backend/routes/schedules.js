const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const Registration = require('../models/Registration');
const { requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const schedules = await Schedule.find().sort({ trainingDate: -1, createdAt: -1 }).lean();

  const ids = schedules.map(s => s._id);

  // Dynamic count aggregation
  const counts = await Registration.aggregate([
    { $match: { scheduleId: { $in: ids }, status: { $ne: 'cancelled' } } },
    // Lookup student to ensure they still exist (handles manual DB deletions)
    {
      $lookup: {
        from: 'students',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student'
      }
    },
    // Only count if student exists (array not empty)
    { $match: { 'student.0': { $exists: true } } },
    { $group: { _id: '$scheduleId', count: { $sum: 1 } } }
  ]);

  const map = Object.fromEntries(counts.map(c => [String(c._id), c.count]));

  const withCounts = schedules.map(s => ({
    ...s,
    registered: map[String(s._id)] || 0
  }));

  res.json(withCounts);
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    // Validation: Capacity cannot be negative
    if (req.body.capacity !== undefined && parseInt(req.body.capacity) < 0) {
      return res.status(400).json({ error: 'Capacity cannot be negative' });
    }

    const schedule = await Schedule.create(req.body);
    res.status(201).json(schedule);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Course ID already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    // Validation: Capacity cannot be negative
    if (req.body.capacity !== undefined && parseInt(req.body.capacity) < 0) {
      return res.status(400).json({ error: 'Capacity cannot be negative' });
    }

    const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
    res.json(schedule);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Course ID already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
