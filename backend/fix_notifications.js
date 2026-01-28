const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectDB } = require('./db');
const Notification = require('./models/Notification');
const AssessmentApplication = require('./models/AssessmentApplication');

dotenv.config();

const fixNotifications = async () => {
  const connected = await connectDB();
  if (!connected) {
      console.log('Could not connect to DB');
      process.exit(1);
  }

  console.log('Finding notifications to fix...');
  const notifications = await Notification.find({
    type: 'assessment',
    message: /Unknown Student/
  });

  console.log(`Found ${notifications.length} notifications to fix.`);

  for (const notification of notifications) {
    if (notification.relatedId) {
      const app = await AssessmentApplication.findById(notification.relatedId);
      if (app && app.name) {
        const studentName = `${app.name.firstname} ${app.name.surname}`;
        notification.message = `New assessment application: ${studentName}`;
        await notification.save();
        console.log(`Fixed notification ${notification._id} -> ${studentName}`);
      } else {
          console.log(`Could not find application or name for notification ${notification._id} (relatedId: ${notification.relatedId})`);
      }
    }
  }

  console.log('Done.');
  process.exit();
};

fixNotifications();
