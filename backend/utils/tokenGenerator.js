const jwt = require('jsonwebtoken');

function generateUserToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role_type: 'user',
    },
    process.env.JWT_SECRET || 'skyreserve_lab_secret_change_me',
    { expiresIn: '7d' }
  );
}

function generateAdminToken(admin) {
  return jwt.sign(
    {
      admin_id: admin.admin_id,
      username: admin.username,
      role: admin.role,
      role_type: 'admin',
    },
    process.env.JWT_SECRET || 'skyreserve_lab_secret_change_me',
    { expiresIn: '7d' }
  );
}

module.exports = { generateUserToken, generateAdminToken };
