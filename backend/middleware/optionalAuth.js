const jwt = require('jsonwebtoken');

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'skyreserve_lab_secret_change_me');
  } catch (error) {
    // Keep lab routes backward compatible; invalid token is ignored here.
  }
  next();
}

module.exports = optionalAuth;
