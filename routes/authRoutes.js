const express = require('express');
const router = express.Router();

const { googleAuth, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate user with Google ID token
 * @access  Public
 * @body    { token: String }  — Google ID token from mobile client
 */
router.post('/google', googleAuth);

/**
 * @route   GET /api/auth/profile
 * @desc    Get the currently authenticated user's profile
 * @access  Private (requires valid JWT in Authorization: Bearer header)
 */
router.get('/profile', protect, getProfile);

module.exports = router;
