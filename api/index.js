const app = require('../backend/server');
const { connectDB } = require('../backend/db');

module.exports = async (req, res) => {
  // Ensure DB is connected before handling the request
  await connectDB();
  
  // Forward request to Express app
  return app(req, res);
};
