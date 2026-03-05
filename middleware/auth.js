const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided, authorization denied' });
        }

        // Extract token (remove 'Bearer ' prefix)
        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Invalid token format' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user_id to request object
        req.user_id = decoded.user_id;
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        res.status(401).json({ error: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
