const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const AssessmentApplication = require('../models/AssessmentApplication');

router.get('/', async (req, res) => {
  try {
    const assessments = await Assessment.find();
    const assessmentsWithAvailability = await Promise.all(assessments.map(async (assessment) => {
      const enrolledCount = await AssessmentApplication.countDocuments({
        assessmentId: assessment._id,
        status: { $ne: 'Rejected' }
      });
      return {
        ...assessment.toObject(),
        enrolledCount,
        availableSlots: Math.max(0, (assessment.capacity || 0) - enrolledCount)
      };
    }));
    res.json(assessmentsWithAvailability);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    // Validation: Fee and Capacity cannot be negative
    if (req.body.fee !== undefined && parseInt(req.body.fee) < 0) {
      return res.status(400).json({ error: 'Fee cannot be negative' });
    }
    if (req.body.capacity !== undefined && parseInt(req.body.capacity) < 0) {
      return res.status(400).json({ error: 'Capacity cannot be negative' });
    }

    const assessment = await Assessment.create(req.body);
    res.status(201).json(assessment);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Assessment ID already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    // Validation: Fee and Capacity cannot be negative
    if (req.body.fee !== undefined && parseInt(req.body.fee) < 0) {
      return res.status(400).json({ error: 'Fee cannot be negative' });
    }
    if (req.body.capacity !== undefined && parseInt(req.body.capacity) < 0) {
      return res.status(400).json({ error: 'Capacity cannot be negative' });
    }

    const assessment = await Assessment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    res.json(assessment);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Assessment ID already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndDelete(req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    res.json({ message: 'Assessment deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
