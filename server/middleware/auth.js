const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from 'Bearer <token>'
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'default_development_jwt_secret_key'
      );

      // Attach user object to request (excluding password)
      try {
        req.user = await User.findById(decoded.id).select('-password');
      } catch (dbErr) {
        console.warn('DB lookup warning during auth:', dbErr.message);
      }

      if (!req.user) {
        if (decoded.id) {
          req.user = {
            _id: decoded.id,
            id: decoded.id,
            email: decoded.email || '',
            role: decoded.role || 'user',
          };
        } else {
          return res.status(401).json({ success: false, message: 'User not found with this token' });
        }
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
