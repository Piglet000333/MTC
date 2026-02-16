const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const AssessmentApplication = require('../models/AssessmentApplication');
const { requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const assessments = await Assessment.find();
    const assessmentsWithAvailability = await Promise.all(assessments.map(async (assessment) => {
      const enrolledCount = await AssessmentApplication.countDocuments({
        assessmentId: assessment._id,
        status: { $in: ['Pending', 'Approved'] }
      });
      
      return {
        ...assessment.toObject(),
        enrolledCount
      };
    }));
    res.json(assessmentsWithAvailability);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    // Validation: Fee cannot be negative
    if (req.body.fee !== undefined && parseInt(req.body.fee) < 0) {
      return res.status(400).json({ error: 'Fee cannot be negative' });
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

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    // Validation: Fee cannot be negative
    if (req.body.fee !== undefined && parseInt(req.body.fee) < 0) {
      return res.status(400).json({ error: 'Fee cannot be negative' });
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

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndDelete(req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    res.json({ message: 'Assessment deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
