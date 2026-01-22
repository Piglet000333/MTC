const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Student = require('../models/Student');
const Schedule = require('../models/Schedule');

// Get all registrations
router.get('/', async (req, res) => {
  const registrations = await Registration.find()
    .populate('studentId')
    .populate('scheduleId');
  res.json(registrations);
});

// Create registration
router.post('/', async (req, res) => {
  try {
    const { studentId, scheduleId, termsAccepted } = req.body;
    
    // Check if already registered
    const existing = await Registration.findOne({ 
      studentId, 
      scheduleId,
      status: 'active'
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Student already registered for this schedule' });
    }

    const reg = await Registration.create({
      studentId,
      scheduleId,
      termsAccepted,
      status: 'active'
    });
    
    res.status(201).json(reg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Cancel registration (by ID)
router.patch('/:id/cancel', async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    if (reg.status === 'cancelled') return res.json({ ok: true, message: 'Already cancelled' });

    reg.status = 'cancelled';
    reg.cancelledAt = new Date();
    await reg.save();

    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// Cancel registration (by email + scheduleId)
router.post('/cancel', async (req, res) => {
  try {
    const { email, scheduleId } = req.body;
    if (!email || !scheduleId) return res.status(400).json({ error: 'email and scheduleId required' });

    const student = await Student.findOne({ email: email.trim().toLowerCase() });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const reg = await Registration.findOne({
      studentId: student._id,
      scheduleId,
      status: 'active'
    });

    if (!reg) return res.status(404).json({ error: 'No active registration found' });

    reg.status = 'cancelled';
    reg.cancelledAt = new Date();
    await reg.save();

    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

module.exports = router;
