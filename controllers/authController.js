const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Initialize google OAuth2 client with the app's client ID
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Generate a signed JWT token for a user.
 * @param {Object} user - Mongoose User document
 * @returns {string} Signed JWT token
 */
const generateJWT = (user) => {
    const payload = {
        userId: user._id,
        email: user.email,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

/**
 * POST /api/auth/google
 * Verifies a Google ID token from the mobile client,
 * creates or retrieves the user, and returns a JWT.
 */
const googleAuth = async (req, res) => {
    const { token } = req.body;

    // --- Input Validation ---
    if (!token) {
        return res.status(400).json({
            success: false,
            message: 'Google ID token is required.',
        });
    }

    try {
        // --- Step 1: Verify the Google ID Token ---
        let googlePayload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            googlePayload = ticket.getPayload();
        } catch (verifyError) {
            console.error('Google token verification failed:', verifyError.message);
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired Google token. Please sign in again.',
            });
        }

        // --- Step 2: Extract User Data from Payload ---
        const { sub: googleId, name, email, picture: profilePicture } = googlePayload;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Could not retrieve email from Google account.',
            });
        }

        // --- Step 3 & 4: Find or Create the User ---
        let user = await User.findOne({ email });

        if (!user) {
            // New user — create an account
            user = await User.create({
                googleId,
                name,
                email,
                profilePicture: profilePicture || '',
            });
            console.log(`👤 New user registered: ${email}`);
        } else {
            // Existing user — update last login and profile picture
            user.lastLogin = new Date();
            if (profilePicture) user.profilePicture = profilePicture;
            await user.save();
            console.log(`✅ Existing user logged in: ${email}`);
        }

        // --- Step 5: Generate JWT Token ---
        const jwtToken = generateJWT(user);

        // --- Step 6: Return Response ---
        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
            },
            token: jwtToken,
        });
    } catch (error) {
        console.error('Error in googleAuth controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.',
        });
    }
};

/**
 * GET /api/auth/profile
 * Returns the authenticated user's profile (requires JWT middleware).
 */
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
            },
        });
    } catch (error) {
        console.error('Error in getProfile controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
        });
    }
};

module.exports = { googleAuth, getProfile };
