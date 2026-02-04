const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
};

const getTokenFromRequest = (req) => {
  const header = req.headers.authorization || req.headers.Authorization;
  if (typeof header === 'string' && header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim();
  }
  return null;
};

const normalizePayload = (payload) => {
  const userId = payload?.sub || payload?._id;
  const role = payload?.role || 'student';
  return { userId, role, payload };
};

const requireAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: 'Missing authentication token' });

    const decoded = jwt.verify(token, getJwtSecret());
    const { userId, role, payload } = normalizePayload(decoded);

    if (!userId) return res.status(401).json({ error: 'Invalid authentication token' });

    req.auth = { userId: String(userId), role, payload };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
};

const requireAdmin = async (req, res, next) => {
  await requireAuth(req, res, async () => {
    if (req.auth.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const admin = await Admin.findById(req.auth.userId);
    if (!admin) return res.status(401).json({ error: 'Admin account not found' });
    req.admin = admin;
    return next();
  });
};

const requireStudent = async (req, res, next) => {
  await requireAuth(req, res, async () => {
    if (req.auth.role !== 'student') return res.status(403).json({ error: 'Student access required' });
    const student = await Student.findById(req.auth.userId);
    if (!student) return res.status(401).json({ error: 'Student account not found' });
    req.student = student;
    return next();
  });
};

const requireStudentOrAdmin = async (req, res, next) => {
  await requireAuth(req, res, async () => {
    if (req.auth.role === 'admin') {
      const admin = await Admin.findById(req.auth.userId);
      if (!admin) return res.status(401).json({ error: 'Admin account not found' });
      req.admin = admin;
      return next();
    }
    if (req.auth.role === 'student') {
      const student = await Student.findById(req.auth.userId);
      if (!student) return res.status(401).json({ error: 'Student account not found' });
      req.student = student;
      return next();
    }
    return res.status(403).json({ error: 'Access denied' });
  });
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireStudent,
  requireStudentOrAdmin
};

