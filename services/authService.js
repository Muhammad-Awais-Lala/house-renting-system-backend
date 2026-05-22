const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

const generateToken = (user) => {
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRY || '7d',
    }
  );
  return token;
};

const registerUser = async (userData) => {
  const { firstName, lastName, email, password, role } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ErrorResponse('Email already in use', 400);
  }

  // Create new user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: role || 'tenant',
  });

  return user;
};

const loginUser = async (email, password) => {
  if (!email || !password) {
    throw new ErrorResponse('Email and password are required', 400);
  }

  // Find user and include password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ErrorResponse('Invalid credentials', 401);
  }

  // Compare password
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw new ErrorResponse('Invalid credentials', 401);
  }

  return user;
};

module.exports = {
  generateToken,
  registerUser,
  loginUser,
};
