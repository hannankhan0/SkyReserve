const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const canAccessProfile = (req, res, next) => {
  if (req.user?.role_type === 'admin' || Number(req.params.id) === Number(req.user?.user_id)) return next();
  return res.status(403).json({ success: false, message: 'You can only access your own profile' });
};

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin-login', authController.adminLogin);

router.get('/profile', auth, (req, res, next) => {
  req.params.id = req.user.user_id;
  return authController.getProfile(req, res, next);
});
router.put('/profile', auth, (req, res, next) => {
  req.params.id = req.user.user_id;
  return authController.updateProfile(req, res, next);
});

router.get('/profile/:id', auth, canAccessProfile, authController.getProfile);
router.put('/profile/:id', auth, canAccessProfile, authController.updateProfile);

module.exports = router;
