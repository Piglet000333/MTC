const app = require('../backend/server');
const { connectDB } = require('../backend/db');

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res, () => {});
};
