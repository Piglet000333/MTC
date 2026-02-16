const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const AssessmentApplication = require('../models/AssessmentApplication');
const Notification = require('../models/Notification');
const Student = require('../models/Student');
const { requireAdmin, requireStudentOrAdmin } = require('../middleware/auth');

// Create a new assessment application
router.post('/', requireStudentOrAdmin, async (req, res) => {
  try {
    const { assessmentId } = req.body;
    const studentId = req.auth.role === 'student' ? req.auth.userId : req.body.studentId;
    if (req.auth.role === 'student' && req.body.studentId && String(req.body.studentId) !== String(studentId)) {
      return res.status(403).json({ error: 'You can only apply for yourself' });
    }
    
    // Check capacity before creating application
    if (assessmentId) {
      const assessment = await Assessment.findById(assessmentId);
      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }

      // Check capacity - Removed (Unlimited)

    }

    // Check for active applications
    const existingActive = await AssessmentApplication.findOne({
      studentId,
      assessmentId,
      status: { $in: ['Pending', 'Approved'] }
    }).lean();
    if (existingActive) {
      return res.status(400).json({ error: 'You already have an active application for this assessment.' });
    }

    // Check rejection limit (2 times max)
    const rejectionCount = await AssessmentApplication.countDocuments({
      studentId,
      assessmentId,
      status: 'Rejected'
    });

    if (rejectionCount >= 2) {
      return res.status(403).json({ error: 'Please contact the admin or go to our office.' });
    }

    const application = await AssessmentApplication.create({ ...req.body, studentId });

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
router.get('/student/:studentId', requireStudentOrAdmin, async (req, res) => {
  try {
    if (req.auth.role === 'student' && String(req.auth.userId) !== String(req.params.studentId)) {
      return res.status(403).json({ error: 'You can only view your own applications' });
    }
    const applications = await AssessmentApplication.find({ studentId: req.params.studentId }).sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all applications (for admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const applications = await AssessmentApplication.find().sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update application status (for admin)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { status, remarks } = req.body;

    if (status === 'Rejected' && (!remarks || !String(remarks).trim())) {
      return res.status(400).json({ error: 'Rejection reason is required.' });
    }
    
    const application = await AssessmentApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const oldStatus = application.status;
    
    // Update fields
    if (status) application.status = status;
    if (remarks !== undefined) application.remarks = remarks;
    // Update other fields if necessary (usually just status/remarks in this context)
    // But to be safe with the previous findByIdAndUpdate(req.body) behavior:
    Object.keys(req.body).forEach(key => {
        if (key !== 'status' && key !== 'remarks' && key !== '_id') {
            application[key] = req.body[key];
        }
    });

    await application.save();

    // Notification Logic
    if (status && status !== oldStatus) {
        try {
            const Notification = require('../models/Notification');
            let message = `Your assessment application for ${application.assessmentTitle || 'Assessment'} has been updated to ${status}.`;
            if (application.remarks) {
                message += ` Remarks: ${application.remarks}`;
            }

            await Notification.create({
                message,
                type: 'assessment',
                relatedId: application._id,
                onModel: 'AssessmentApplication',
                studentId: application.studentId
            });
        } catch (e) {
            console.error('Failed to create notification', e);
        }
    }

    res.json(application);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete an application
router.delete('/:id', requireStudentOrAdmin, async (req, res) => {
  try {
    const existing = await AssessmentApplication.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Application not found' });
    }
    if (req.auth.role === 'student') {
      if (String(existing.studentId) !== String(req.auth.userId)) {
        return res.status(403).json({ error: 'You can only cancel your own application' });
      }
      if (existing.status !== 'Pending') {
        return res.status(400).json({ error: 'Only pending applications can be cancelled' });
      }
    }
    const application = await AssessmentApplication.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check and update assessment capacity/status after deletion - Removed (Unlimited)


    res.json({ message: 'Application deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
