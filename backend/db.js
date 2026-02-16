const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return true;
  }

  const primary = process.env.MONGODB_URI;
  const fallback = process.env.MONGODB_DIRECT_URI;

  try {
    // Increase timeout to 30 seconds for slow connections
    const conn = await mongoose.connect(primary, { serverSelectionTimeoutMS: 30000 });
    console.log(`mongoDB connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.log('Error connecting to DB (primary). Check your MongoDB Atlas IP Whitelist (Network Access) or Internet connection.', error.message);
  }

  if (fallback) {
    try {
      await mongoose.disconnect().catch(() => {});
      const conn2 = await mongoose.connect(fallback, {
        serverSelectionTimeoutMS: 30000,
        directConnection: true
      });
      console.log(`mongoDB connected using fallback: ${conn2.connection.host}`);
      return true;
    } catch (error2) {
      console.log('error connecting to DB (fallback): ', error2);
    }
  }

  console.log('DB connection failed (primary and fallback).');
  return false;
};

module.exports = { connectDB };
