const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema mapped directly to the existing 'users' collection in test_copy
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      select: true,
    },
    role: {
      type: String,
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'users', // Strictly targets the existing 'users' collection
    strict: false,       // Allows reading other existing fields in documents
    timestamps: true,
  }
);

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export model bound to existing 'users' collection
module.exports = mongoose.model('User', userSchema, 'users');
