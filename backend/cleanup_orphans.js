const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file (one level up if run from backend/)
// Or from current dir if run from root. Let's try root first.
const rootEnvPath = path.resolve(__dirname, '.env');
dotenv.config({ path: rootEnvPath });

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Import Models
const Student = require('./models/Student');
const Schedule = require('./models/Schedule');
const Registration = require('./models/Registration');
const AssessmentApplication = require('./models/AssessmentApplication');
const Notification = require('./models/Notification');
const Assessment = require('./models/Assessment');

const cleanupOrphans = async () => {
  await connectDB();

  console.log('Starting cleanup of orphaned documents...');

  // --- 1. Clean Registrations (Student & Schedule) ---
  console.log('\n--- Checking Registrations ---');
  const registrations = await Registration.find({});
  let regDeletedCount = 0;

  for (const reg of registrations) {
    let shouldDelete = false;
    let reason = '';

    // Check if Student exists
    if (reg.studentId) {
      const student = await Student.findById(reg.studentId);
      if (!student) {
        shouldDelete = true;
        reason = `Student ID ${reg.studentId} not found`;
      }
    } else {
        // If studentId is missing entirely, it's invalid
        shouldDelete = true;
        reason = 'Missing studentId field';
    }

    // Check if Schedule (Course) exists
    if (!shouldDelete && reg.scheduleId) {
      const schedule = await Schedule.findById(reg.scheduleId);
      if (!schedule) {
        shouldDelete = true;
        reason = `Schedule ID ${reg.scheduleId} not found`;
      }
    } else if (!shouldDelete) {
        shouldDelete = true;
        reason = 'Missing scheduleId field';
    }

    if (shouldDelete) {
      console.log(`Deleting Registration ${reg._id}: ${reason}`);
      
      // If we are deleting because Student is gone, but Schedule still exists, 
      // we must decrement the Schedule's registered count to free up the slot.
      if (reason.includes('Student ID') && reg.scheduleId) {
          const schedule = await Schedule.findById(reg.scheduleId);
          // Only decrement if the registration was taking up a spot (Active or Pending)
          if (schedule && ['active', 'pending'].includes(reg.status)) {
              schedule.registered = Math.max(0, (schedule.registered || 0) - 1);
              await schedule.save();
              console.log(`  -> Decremented count for Schedule ${schedule.courseId}`);
          }
      }

      await Registration.findByIdAndDelete(reg._id);
      regDeletedCount++;
    }
  }
  console.log(`Deleted ${regDeletedCount} orphaned registrations.`);


  // --- 2. Clean Assessment Applications ---
  console.log('\n--- Checking Assessment Applications ---');
  const applications = await AssessmentApplication.find({});
  let appDeletedCount = 0;

  for (const app of applications) {
    let shouldDelete = false;
    let reason = '';

    // Check Student (only if linked)
    if (app.studentId) {
      const student = await Student.findById(app.studentId);
      if (!student) {
        shouldDelete = true;
        reason = `Student ID ${app.studentId} not found`;
      }
    }

    // Check Assessment
    if (!shouldDelete && app.assessmentId) {
        const assessment = await Assessment.findById(app.assessmentId);
        if (!assessment) {
            shouldDelete = true;
            reason = `Assessment ID ${app.assessmentId} not found`;
        }
    }

    if (shouldDelete) {
      console.log(`Deleting AssessmentApplication ${app._id}: ${reason}`);
      await AssessmentApplication.findByIdAndDelete(app._id);
      appDeletedCount++;
    }
  }
  console.log(`Deleted ${appDeletedCount} orphaned assessment applications.`);


  // --- 3. Clean Notifications ---
  console.log('\n--- Checking Notifications ---');
  const notifications = await Notification.find({});
  let notifDeletedCount = 0;

  for (const notif of notifications) {
      let shouldDelete = false;
      let reason = '';

      // Check Student recipient
      if (notif.studentId) {
          const student = await Student.findById(notif.studentId);
          if (!student) {
              shouldDelete = true;
              reason = `Student ID ${notif.studentId} not found`;
          }
      }

      // Check related entity (e.g., the Registration or Assessment)
      if (!shouldDelete && notif.relatedId && notif.onModel) {
          try {
              if (mongoose.models[notif.onModel]) {
                  const related = await mongoose.model(notif.onModel).findById(notif.relatedId);
                  if (!related) {
                      shouldDelete = true;
                      reason = `Related ${notif.onModel} ${notif.relatedId} not found`;
                  }
              }
          } catch (e) {
              // Ignore errors for unknown models
          }
      }

      if (shouldDelete) {
          console.log(`Deleting Notification ${notif._id}: ${reason}`);
          await Notification.findByIdAndDelete(notif._id);
          notifDeletedCount++;
      }
  }
  console.log(`Deleted ${notifDeletedCount} orphaned notifications.`);

  console.log('\nCleanup complete.');
  process.exit();
};

cleanupOrphans();
