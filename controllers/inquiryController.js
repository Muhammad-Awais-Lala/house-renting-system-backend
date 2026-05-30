const Inquiry = require('../models/Inquiry');
const ErrorResponse = require('../utils/errorResponse');

// @route   POST /api/inquiries
// @desc    Submit a new inquiry (Public)
// @access  Public
exports.createInquiry = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return next(new ErrorResponse('Please provide name, email, and message', 400));
    }

    const inquiry = await Inquiry.create({
      name,
      email,
      subject: subject || 'No Subject',
      message,
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully',
      inquiry,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/inquiries
// @desc    Get all inquiries (Admin only)
// @access  Private/Admin
exports.getAllInquiries = async (req, res, next) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: inquiries.length,
      inquiries,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/inquiries/:id
// @desc    Get inquiry details & mark as read (Admin only)
// @access  Private/Admin
exports.getInquiryById = async (req, res, next) => {
  try {
    let inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return next(new ErrorResponse('Inquiry not found', 404));
    }

    // Mark as read
    inquiry.isRead = true;
    await inquiry.save();

    res.status(200).json({
      success: true,
      inquiry,
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/inquiries/:id
// @desc    Delete inquiry (Admin only)
// @access  Private/Admin
exports.deleteInquiry = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return next(new ErrorResponse('Inquiry not found', 404));
    }

    await Inquiry.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Inquiry removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
