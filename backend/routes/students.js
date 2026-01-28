const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Registration = require('../models/Registration');
const Schedule = require('../models/Schedule');
const mongoose = require('mongoose');

router.get('/', async (req, res) => {
  const students = await Student.find();
  res.json(students);
});

router.post('/', async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'This email is already registered.' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid student id' });
    }

    const session = await Student.startSession();
    session.startTransaction();
    try {
      const student = await Student.findById(id).session(session);
      if (!student) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ error: 'Student not found' });
      }

      const regs = await Registration.find({ studentId: id }).session(session);
      let updatedSchedules = 0;
      for (const reg of regs) {
        const sched = await Schedule.findById(reg.scheduleId).session(session);
        if (sched) {
          sched.registered = Math.max(0, (sched.registered || 0) - 1);
          await sched.save({ session });
          updatedSchedules += 1;
        }
        await Registration.deleteOne({ _id: reg._id }).session(session);
      }

      await Student.findByIdAndDelete(id).session(session);
      await session.commitTransaction();
      session.endSession();
      return res.json({
        message: 'Student deleted; registrations removed and schedules updated',
        removedRegistrations: regs.length,
        updatedSchedules
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ error: err.message });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
