const express = require('express');
const {
  signup,
  verifyEmail,
  resendVerificationEmail,
  login,
  logout,
  getMe,
  checkAuthStatus
} = require('../controllers/authController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/logout', logout);

// Route that works with or without authentication
router.get('/status', optionalAuth, checkAuthStatus);

// Protected routes (require authentication)
router.use(protect); // All routes after this middleware are protected

router.get('/me', getMe);

module.exports = router;
