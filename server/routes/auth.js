const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Generate JWT token with user id, email, and role
const generateToken = (userOrId, email, role) => {
  const payload =
    typeof userOrId === 'object' && userOrId !== null
      ? {
          id: userOrId._id || userOrId.id,
          email: userOrId.email,
          role: userOrId.role || 'user',
        }
      : {
          id: userOrId,
          email: email || '',
          role: role || 'user',
        };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'default_development_jwt_secret_key',
    {
      expiresIn: '7d',
    }
  );
};

// @route   POST /api/auth/login
// @desc    Authenticate existing user from 'users' collection & issue JWT
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email address and password.',
      });
    }

    const cleanEmail = email.trim();

    // Find user in existing 'users' collection (case-insensitive)
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email in the database.',
      });
    }

    // Check if account is active (if status field exists)
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact support.',
      });
    }

    // Verify password with bcrypt
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please verify and try again.',
      });
    }

    const currentLoginTime = new Date();

    // Update lastLogin timestamp without triggering document save hooks
    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: currentLoginTime } }
    );

    // Generate JWT token with user id, email, and role
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name || 'User',
        email: user.email,
        role: user.role || 'user',
        title: user.title || '',
        avatar: user.avatar || '',
        lastLogin: currentLoginTime,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred during login',
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile (JWT protected)
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
    });
  }
});

module.exports = router;
