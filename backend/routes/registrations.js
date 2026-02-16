const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Student = require('../models/Student');
const Schedule = require('../models/Schedule');
const Notification = require('../models/Notification');
const { requireAdmin, requireStudentOrAdmin } = require('../middleware/auth');

// Get all registrations
router.get('/', requireAdmin, async (req, res) => {
  const registrations = await Registration.find()
    .populate('studentId')
    .populate('scheduleId');
  res.json(registrations);
});

// Get registrations for a specific student
router.get('/student/:studentId', requireStudentOrAdmin, async (req, res) => {
  try {
    if (req.auth.role === 'student' && String(req.auth.userId) !== String(req.params.studentId)) {
      return res.status(403).json({ error: 'You can only view your own registrations' });
    }
    const registrations = await Registration.find({ studentId: req.params.studentId })
      .populate('scheduleId')
      .sort({ createdAt: -1 });
    res.json(registrations);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create registration
router.post('/', requireStudentOrAdmin, async (req, res) => {
  try {
    const { studentId, scheduleId, termsAccepted, payment } = req.body;
    const effectiveStudentId = req.auth.role === 'student' ? req.auth.userId : studentId;
    if (req.auth.role === 'student' && studentId && String(studentId) !== String(effectiveStudentId)) {
      return res.status(403).json({ error: 'You can only create registrations for yourself' });
    }
    
    // Determine status: Admin -> active, Student -> pending
    const initialStatus = req.auth.role === 'admin' ? 'active' : 'pending';

    const existingAny = await Registration.findOne({ studentId: effectiveStudentId, scheduleId });

    let reg;
    if (existingAny) {
      const existingStatus = String(existingAny.status || '').toLowerCase();

      if (['active', 'pending', 'completed'].includes(existingStatus)) {
        return res.status(400).json({ error: 'Student already registered for this schedule' });
      }

      const rejectionCount = Number(existingAny.rejectionCount || 0);
      if (rejectionCount >= 3) {
        return res.status(403).json({ error: 'Oops! It looks like you have already attempted this action twice. For further assistance, please reach out to our admin team or visit our office. We are here to help.' });
      }

      const schedule = await Schedule.findById(scheduleId);
      if (!schedule) {
        return res.status(400).json({ error: 'Schedule not found' });
      }

      const occupyingCount = await Registration.countDocuments({
        scheduleId,
        status: { $in: ['active', 'pending'] }
      });

      if (occupyingCount >= schedule.capacity) {
        return res.status(400).json({ error: 'Schedule is full. Capacity reached.' });
      }

      existingAny.status = initialStatus;
      existingAny.termsAccepted = !!termsAccepted;
      existingAny.payment = payment;
      existingAny.remarks = undefined;
      existingAny.cancelledAt = undefined;

      const oldCounted = ['active', 'pending'].includes(existingStatus);
      const newCounted = ['active', 'pending'].includes(initialStatus);
      await existingAny.save();

      if (!oldCounted && newCounted) {
        await Schedule.findByIdAndUpdate(scheduleId, { $inc: { registered: 1 } });
      }

      reg = existingAny;
    } else {
      reg = await Registration.create({
        studentId: effectiveStudentId,
        scheduleId,
        termsAccepted,
        status: initialStatus,
        payment
      });

      // Update Schedule registered count
      await Schedule.findByIdAndUpdate(scheduleId, { $inc: { registered: 1 } });
    }
    
    // Create notification
    try {
      const student = await Student.findById(effectiveStudentId);
      await Notification.create({
        message: `New registration: ${student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}`,
        type: 'registration',
        relatedId: reg._id,
        onModel: 'Registration'
      });
    } catch (notifyErr) {
      console.error('Failed to create notification:', notifyErr);
      // Don't fail the registration if notification fails
    }
    
    res.status(existingAny ? 200 : 201).json(reg);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Student already registered for this schedule' });
    }
    res.status(400).json({ error: err.message });
  }
});

// Cancel registration (by ID)
router.patch('/:id/cancel', requireStudentOrAdmin, async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    if (reg.status === 'cancelled') return res.json({ ok: true, message: 'Already cancelled' });
    if (req.auth.role === 'student' && String(reg.studentId) !== String(req.auth.userId)) {
      return res.status(403).json({ error: 'You can only cancel your own registration' });
    }

    const oldStatus = String(reg.status || '').toLowerCase();
    reg.status = 'cancelled';
    reg.cancelledAt = new Date();
    if (!['cancelled', 'dropped', 'rejected'].includes(oldStatus)) {
      reg.rejectionCount = Number(reg.rejectionCount || 0) + 1;
    }
    await reg.save();

    // Decrement Schedule registered count
    if (reg.scheduleId) {
      await Schedule.findByIdAndUpdate(reg.scheduleId, { $inc: { registered: -1 } });
    }

    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// Cancel registration (by email + scheduleId)
router.post('/cancel', requireAdmin, async (req, res) => {
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

    const oldStatus = String(reg.status || '').toLowerCase();
    reg.status = 'cancelled';
    reg.cancelledAt = new Date();
    if (!['cancelled', 'dropped', 'rejected'].includes(oldStatus)) {
      reg.rejectionCount = Number(reg.rejectionCount || 0) + 1;
    }
    await reg.save();

    // Decrement Schedule registered count
    if (reg.scheduleId) {
      await Schedule.findByIdAndUpdate(reg.scheduleId, { $inc: { registered: -1 } });
    }

    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// Update registration (e.g. change schedule)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { scheduleId, status, remarks } = req.body;
    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ error: 'Registration not found' });

    const oldScheduleId = reg.scheduleId;
    const oldStatus = reg.status;
    const oldStatusLower = String(oldStatus || '').toLowerCase();
    const nextStatusLower = status ? String(status).toLowerCase() : oldStatusLower;

    if (scheduleId) reg.scheduleId = scheduleId;
    if (status) reg.status = status;
    if (remarks !== undefined) reg.remarks = remarks;

    if (
      status &&
      oldStatusLower !== nextStatusLower &&
      ['cancelled', 'dropped', 'rejected'].includes(nextStatusLower) &&
      !['cancelled', 'dropped', 'rejected'].includes(oldStatusLower)
    ) {
      reg.rejectionCount = Number(reg.rejectionCount || 0) + 1;
    }
    
    await reg.save();

    // Create Notification if status changed
    if (oldStatus !== reg.status) {
      try {
        const schedule = await Schedule.findById(reg.scheduleId);
        const courseTitle = schedule ? (schedule.courseTitle || schedule.title) : 'Course';
        
        let message = `Your registration for ${courseTitle} has been updated to ${reg.status}.`;
        if (reg.remarks) {
          message += ` Reason: ${reg.remarks}`;
        }

        await Notification.create({
          message,
          type: 'registration',
          relatedId: reg._id,
          onModel: 'Registration',
          studentId: reg.studentId
        });
      } catch (e) {
        console.error('Failed to create notification', e);
      }
    }

    // Handle Schedule counts
    const newScheduleId = reg.scheduleId;
    const newStatus = reg.status;

    const countedStatuses = ['active', 'pending'];

    // 1. If schedule changed
    if (oldScheduleId && newScheduleId && oldScheduleId.toString() !== newScheduleId.toString()) {
      if (countedStatuses.includes(String(oldStatus).toLowerCase())) {
        await Schedule.findByIdAndUpdate(oldScheduleId, { $inc: { registered: -1 } });
      }
      if (countedStatuses.includes(String(newStatus).toLowerCase())) {
        await Schedule.findByIdAndUpdate(newScheduleId, { $inc: { registered: 1 } });
      }
    } 
    // 2. If status changed (same schedule)
    else if (oldStatus !== newStatus && newScheduleId) {
      const oldCounted = countedStatuses.includes(String(oldStatus).toLowerCase());
      const newCounted = countedStatuses.includes(String(newStatus).toLowerCase());
      if (oldCounted && !newCounted) {
        await Schedule.findByIdAndUpdate(newScheduleId, { $inc: { registered: -1 } });
      } else if (!oldCounted && newCounted) {
        await Schedule.findByIdAndUpdate(newScheduleId, { $inc: { registered: 1 } });
      }
    }

    res.json(reg);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Delete registration
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const reg = await Registration.findByIdAndDelete(req.params.id);
    if (!reg) return res.status(404).json({ error: 'Registration not found' });

    // Decrement Schedule registered count if it was active
    if (reg.status === 'active' && reg.scheduleId) {
      await Schedule.findByIdAndUpdate(reg.scheduleId, { $inc: { registered: -1 } });
    }

    res.json({ message: 'Registration deleted' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
