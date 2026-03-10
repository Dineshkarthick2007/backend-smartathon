const jwt = require('jsonwebtoken');

/**
 * Middleware: Protect routes that require authentication.
 *
 * This middleware reads the JWT from the Authorization header,
 * verifies it, and attaches the decoded user payload to req.user.
 *
 * Expected header format:
 *   Authorization: Bearer <jwt_token>
 */
const protect = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        // Check if Authorization header is present
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No Authorization header provided.',
            });
        }

        // Validate "Bearer <token>" format
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Invalid Authorization header format. Use: Bearer <token>',
            });
        }

        const token = parts[1];

        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the decoded user info to the request for downstream handlers
        req.user = decoded; // { userId, email, iat, exp }

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please sign in again.',
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Access denied.',
            });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication.',
        });
    }
};

module.exports = { protect };
