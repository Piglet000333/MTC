const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const PendingStudent = require('../models/PendingStudent');
const Registration = require('../models/Registration');
const Schedule = require('../models/Schedule');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { requireAdmin, requireStudentOrAdmin } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { getOTPEmailTemplate, getForgotPasswordEmailTemplate } = require('../utils/emailTemplates');

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Add these to your .env file
    pass: process.env.EMAIL_PASS
  }
});

const signStudentToken = (studentId) => {
  return jwt.sign(
    { sub: studentId, role: 'student' },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '15m' }
  );
};

// Google Login
router.post('/google-login', async (req, res) => {
  try {
    const { token } = req.body;
    let email, name, picture;

    try {
      // Try verify as ID token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } catch (e) {
      // Try as access token
      const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.error) throw new Error('Invalid token');
      email = data.email;
      name = data.name;
      picture = data.picture;
    }

    let student = await Student.findOne({ email });

    if (!student) {
      // Auto-register for Google Login
      const names = name ? name.split(' ') : ['User'];
      const firstName = names[0];
      const lastName = names.slice(1).join(' ') || '.';
      
      // Generate a random password
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 8);

      student = await Student.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        age: 18, // Default age
        isVerified: true // Google accounts are verified
      });
    }

    const jwtToken = signStudentToken(student._id.toString());
    res.json({ student, token: jwtToken });
  } catch (err) {
    res.status(400).json({ error: 'Google login failed: ' + err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(400).json({ error: 'Account not found. Please sign up.' });
    }
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid login credentials' });
    }
    
    // Check if account is verified
    if (student.isVerified === false) {
      return res.status(403).json({ error: 'Please verify your email address before logging in.' });
    }

    const token = signStudentToken(student._id.toString());
    res.json({ student, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', requireAdmin, async (req, res) => {
  const students = await Student.find();
  res.json(students);
});

router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    // First check existing students (in case they are unverified)
    let student = await Student.findOne({ email });
    let isPending = false;

    if (!student) {
      // Check pending students
      student = await PendingStudent.findOne({ email });
      isPending = true;
    }

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (!isPending && student.isVerified) {
      return res.status(400).json({ error: 'Account already verified' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    student.verificationCode = verificationCode;
    // Reset expiration for pending students
    if (isPending) {
        student.createdAt = Date.now(); // Extend TTL
    }
    await student.save();

    const mailOptions = {
      from: `"Mechatronic Training Corp" <${process.env.EMAIL_USER}>`,
      to: student.email,
      subject: 'Verify your Student Portal Account',
      html: getOTPEmailTemplate(verificationCode)
    };

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
        console.log('Resent verification email to:', student.email);
      } else {
        console.log('Email credentials missing. Verification code for', student.email, 'is:', verificationCode);
      }
    } catch (emailErr) {
      console.error('Error sending email:', emailErr);
      console.log('Fallback: Verification code is:', verificationCode);
    }

    res.json({ message: 'Verification code resent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const student = await Student.findOne({ email });

    if (!student) {
      // Security: Don't reveal if user exists or not, but for this app we'll be explicit or generic
      return res.status(404).json({ error: 'No account found with that email' });
    }

    // Generate Token
    const resetToken = crypto.randomBytes(20).toString('hex');
    student.resetPasswordToken = resetToken;
    student.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await student.save();

    // Create Reset Link
    // Assuming frontend runs on port 3000 by default in dev, or same domain in prod
    // We should ideally use an ENV var for FRONTEND_URL
    const frontendUrl = process.env.FRONTEND_URL || 'https://mtc-portal.vercel.app';
    const resetLink = `${frontendUrl}/student/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"Mechatronic Training Corp" <${process.env.EMAIL_USER}>`,
      to: student.email,
      subject: 'Password Reset Request',
      html: getForgotPasswordEmailTemplate(resetLink)
    };

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
        console.log('Password reset email sent to:', student.email);
      } else {
        console.log('Email credentials missing. Reset link for', student.email, 'is:', resetLink);
      }
    } catch (emailErr) {
      console.error('Error sending email:', emailErr);
      console.log('Fallback: Reset link is:', resetLink);
    }

    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const student = await Student.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!student) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
    }

    // Set new password
    student.password = await bcrypt.hash(newPassword, 8);
    student.resetPasswordToken = undefined;
    student.resetPasswordExpires = undefined;
    await student.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    let student = await Student.findOne({ email });
    let isPending = false;

    if (!student) {
      // Check PendingStudent
      student = await PendingStudent.findOne({ email });
      isPending = true;
    }

    if (!student) {
      return res.status(404).json({ error: 'Student not found or verification expired' });
    }

    if (!isPending && student.isVerified) {
      return res.status(400).json({ error: 'Account already verified' });
    }

    if (student.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // If it was a pending student, create the real student now
    if (isPending) {
        // Create actual student record
        const newStudentData = student.toObject();
        delete newStudentData._id;
        delete newStudentData.__v;
        delete newStudentData.createdAt; // Let new schema handle timestamps
        
        newStudentData.isVerified = true;
        newStudentData.verificationCode = undefined;
        
        const newStudent = await Student.create(newStudentData);
        
        // Remove pending record
        await PendingStudent.deleteOne({ _id: student._id });
        
        student = newStudent;
    } else {
        student.isVerified = true;
        student.verificationCode = undefined;
        await student.save();
    }

    const token = signStudentToken(student._id.toString());
    res.json({ student, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    // 1. Check if student already exists
    const existingStudent = await Student.findOne({ email: req.body.email });
    if (existingStudent) {
        if (existingStudent.isVerified) {
            return res.status(400).json({ error: 'This email is already registered.' });
        } else {
            // Unverified existing student - resend code logic handled below or here?
            // To be consistent with "Schema creation should not proceed", we should probably delete the old unverified one and start fresh,
            // OR just tell them to verify.
            // Let's reuse the resend logic for UX consistency.
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            existingStudent.verificationCode = verificationCode;
            await existingStudent.save();

            // Send Email
            const mailOptions = {
                from: `"Mechatronic Training Corp" <${process.env.EMAIL_USER}>`,
                to: existingStudent.email,
                subject: 'Verify your Student Portal Account',
                html: getOTPEmailTemplate(verificationCode)
            };
            // ... send email logic ...
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                transporter.sendMail(mailOptions).catch(err => console.error(err));
            } else {
                console.log('Verification code for', existingStudent.email, 'is:', verificationCode);
            }

            return res.status(201).json({ 
                student: existingStudent, 
                requiresVerification: true,
                message: 'Account exists but unverified. Verification code resent.' 
            });
        }
    }

    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 8);
    }

    // Generate Verification Code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    req.body.verificationCode = verificationCode;
    req.body.isVerified = false;

    // Create PENDING Student instead of real Student
    // Check if pending exists, update it if so
    await PendingStudent.deleteOne({ email: req.body.email });
    
    const pendingStudent = await PendingStudent.create(req.body);

    // Send Verification Email
    const mailOptions = {
      from: `"Mechatronic Training Corp" <${process.env.EMAIL_USER}>`,
      to: pendingStudent.email,
      subject: 'Verify your Student Portal Account',
      html: getOTPEmailTemplate(verificationCode)
    };

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent to:', pendingStudent.email);
      } else {
        console.log('Email credentials missing. Verification code for', pendingStudent.email, 'is:', verificationCode);
      }
    } catch (emailErr) {
      console.error('Error sending email:', emailErr);
      // Fallback: log code if email fails so testing can continue
      console.log('Fallback: Verification code is:', verificationCode);
    }

    // Return requiresVerification flag instead of token
    res.status(201).json({ 
      student: pendingStudent, 
      requiresVerification: true,
      message: 'Verification code sent. Please verify your email.' 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireStudentOrAdmin, async (req, res) => {
  try {
    if (req.auth.role === 'student' && String(req.auth.userId) !== String(req.params.id)) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 8);
    }
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Transfer Student Schedule
router.post('/:id/transfer-schedule', requireAdmin, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { newScheduleId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(newScheduleId)) {
      throw new Error('Invalid IDs provided');
    }

    // 1. Check if new schedule exists and has capacity
    const newSchedule = await Schedule.findById(newScheduleId).session(session);
    if (!newSchedule) throw new Error('New schedule not found');
    
    // Check capacity (though Registration pre-save checks this, we double check here for atomicity)
    if (newSchedule.registered >= newSchedule.capacity) {
      // Check if student is ALREADY in this schedule (re-activating)
      const existingReg = await Registration.findOne({ studentId: id, scheduleId: newScheduleId }).session(session);
      if (!existingReg || existingReg.status === 'cancelled') {
         throw new Error('New schedule is full');
      }
    }

    // 2. Find ALL active registrations for this student
    const activeRegs = await Registration.find({ 
      studentId: id, 
      status: { $in: ['active', 'pending'] } 
    }).session(session);

    // 3. Process transfers
    let oldScheduleId = null;

    for (const reg of activeRegs) {
      if (reg.scheduleId.toString() === newScheduleId) {
        // Already registered here. If active, do nothing.
        await session.commitTransaction();
        session.endSession();
        return res.json({ message: 'Student is already registered in this schedule' });
      }

      // Cancel other active registration
      reg.status = 'cancelled';
      reg.cancelledAt = new Date();
      await reg.save({ session });

      // Update old schedule count
      const oldSched = await Schedule.findById(reg.scheduleId).session(session);
      if (oldSched) {
        oldSched.registered = Math.max(0, oldSched.registered - 1);
        await oldSched.save({ session });
        oldScheduleId = oldSched._id;
      }
    }

    // 4. Create or Reactivate Registration for New Schedule
    const existingTargetReg = await Registration.findOne({ 
      studentId: id, 
      scheduleId: newScheduleId 
    }).session(session);

    let shouldIncrement = true;

    if (existingTargetReg) {
      // If it was cancelled, we need to increment (because it wasn't counted).
      // If it was active or completed, it WAS counted, so we DO NOT increment.
      if (existingTargetReg.status !== 'cancelled') {
          shouldIncrement = false;
      }

      existingTargetReg.status = 'active';
      existingTargetReg.termsAccepted = true; // Assume admin override accepts terms
      await existingTargetReg.save({ session });
    } else {
      const newReg = new Registration({
        studentId: id,
        scheduleId: newScheduleId,
        termsAccepted: true,
        status: 'active'
      });
      await newReg.save({ session });
    }

    // 5. Update New Schedule Count
    if (shouldIncrement) {
      newSchedule.registered = (newSchedule.registered || 0) + 1;
      await newSchedule.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.json({ 
      message: 'Schedule transferred successfully', 
      from: oldScheduleId, 
      to: newScheduleId 
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
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
