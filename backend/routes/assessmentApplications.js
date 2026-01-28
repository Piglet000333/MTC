const express = require('express');
const router = express.Router();
const AssessmentApplication = require('../models/AssessmentApplication');
const Notification = require('../models/Notification');
const Student = require('../models/Student');

// Create a new assessment application
router.post('/', async (req, res) => {
  try {
    const application = await AssessmentApplication.create(req.body);

    // Create notification
    try {
      const { name } = req.body;
      const studentName = name ? `${name.firstname} ${name.surname}` : 'Unknown Student';
      
      await Notification.create({
        message: `New assessment application: ${studentName}`,
        type: 'assessment',
        relatedId: application._id,
        onModel: 'AssessmentApplication'
      });
    } catch (notifyErr) {
      console.error('Failed to create notification:', notifyErr);
      // Don't fail the application if notification fails
    }

    res.status(201).json(application);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get applications for a specific student
router.get('/student/:studentId', async (req, res) => {
  try {
    const applications = await AssessmentApplication.find({ studentId: req.params.studentId }).sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all applications (for admin)
router.get('/', async (req, res) => {
  try {
    const applications = await AssessmentApplication.find().sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update application status (for admin)
router.put('/:id', async (req, res) => {
  try {
    const application = await AssessmentApplication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(application);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete an application
router.delete('/:id', async (req, res) => {
  try {
    const application = await AssessmentApplication.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json({ message: 'Application deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
