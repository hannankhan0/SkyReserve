const jwt = require('jsonwebtoken');

function adminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Admin authorization token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'skyreserve_lab_secret_change_me');
    if (decoded.role_type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
  }
}

module.exports = adminAuth;
