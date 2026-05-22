const User = require('../models/User');
const authService = require('../services/authService');
const ErrorResponse = require('../utils/errorResponse');
const cloudinaryService = require('../services/cloudinaryService');

// @route   POST /users/register
// @desc    Register a new user
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, role } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return next(new ErrorResponse('Please provide all required fields', 400));
    }

    if (password !== confirmPassword) {
      return next(new ErrorResponse('Passwords do not match', 400));
    }

    if (password.length < 6) {
      return next(new ErrorResponse('Password must be at least 6 characters', 400));
    }

    // Register user
    const user = await authService.registerUser({
      firstName,
      lastName,
      email,
      password,
      role,
    });

    // Generate token
    const token = authService.generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /users/login
// @desc    Login user
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorResponse('Please provide email and password', 400));
    }

    // Login user
    const user = await authService.loginUser(email, password);

    // Generate token
    const token = authService.generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /users/:id
// @desc    Get user profile
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /users/:id
// @desc    Update user profile
// @access  Private
exports.updateUserProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phoneNumber, bio, address, city, country, zipCode } = req.body;

    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Check authorization
    if (user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to update this profile', 403));
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (bio) user.bio = bio;
    if (address) user.address = address;
    if (city) user.city = city;
    if (country) user.country = country;
    if (zipCode) user.zipCode = zipCode;

    // Handle profile image upload if file is present
    if (req.file) {
      try {
        // Delete old image if exists
        if (user.profileImage) {
          // Extract publicId from URL if needed
          const publicId = `intelligent-house-renting/${user._id}-profile`;
          await cloudinaryService.deleteImage(publicId);
        }

        // Upload new image
        const uploadedImage = await cloudinaryService.uploadImage(req.file.path);
        user.profileImage = uploadedImage.url;
      } catch (uploadError) {
        return next(uploadError);
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /users
// @desc    Get all users (Admin only)
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive } = req.query;
    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query).select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /users/role/:role
// @desc    Get users by role
// @access  Public
exports.getUsersByRole = async (req, res, next) => {
  try {
    const { role } = req.params;

    if (!['tenant', 'landlord', 'admin'].includes(role)) {
      return next(new ErrorResponse('Invalid role', 400));
    }

    const users = await User.find({ role, isActive: true }).select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};
