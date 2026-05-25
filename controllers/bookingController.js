const Booking = require('../models/Booking');
const Property = require('../models/Property');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @route   POST /bookings
// @desc    Create a booking request (Tenant only)
// @access  Private/Tenant
exports.createBooking = async (req, res, next) => {
  try {
    const { propertyId, moveInDate, duration, numberOfOccupants, messageToLandlord } = req.body;

    // Validation
    if (!propertyId || !moveInDate || !duration || !numberOfOccupants) {
      return next(new ErrorResponse('Please provide all required fields', 400));
    }

    if (numberOfOccupants < 1) {
      return next(new ErrorResponse('Number of occupants must be at least 1', 400));
    }

    // Get property
    const property = await Property.findById(propertyId);
    if (!property) {
      return next(new ErrorResponse('Property not found', 404));
    }

    // Prevent landlord from booking their own property
    if (property.landlordId.toString() === req.user.id) {
      return next(new ErrorResponse('Landlords cannot book their own property', 400));
    }

    // Prevent duplicate active booking requests for the same property by the same tenant
    const existingBooking = await Booking.findOne({
      tenantId: req.user.id,
      propertyId,
      bookingStatus: { $in: ['pending', 'approved'] }
    });

    if (existingBooking) {
      return next(new ErrorResponse('You already have an active booking request for this property', 400));
    }

    // Create booking
    const booking = await Booking.create({
      tenantId: req.user.id,
      propertyId,
      landlordId: property.landlordId,
      moveInDate,
      duration,
      numberOfOccupants,
      messageToLandlord,
      bookingStatus: 'pending',
    });

    await booking.populate([
      { path: 'tenantId', select: 'firstName lastName email profileImage' },
      { path: 'propertyId', select: 'title price location' },
      { path: 'landlordId', select: 'firstName lastName email profileImage' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Booking request created successfully',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /bookings/:id
// @desc    Get booking by ID
// @access  Private
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate([
      { path: 'tenantId', select: 'firstName lastName email phoneNumber profileImage' },
      { path: 'propertyId' },
      { path: 'landlordId', select: 'firstName lastName email profileImage' },
    ]);

    if (!booking) {
      return next(new ErrorResponse('Booking not found', 404));
    }

    // Check authorization
    if (
      booking.tenantId._id.toString() !== req.user.id &&
      booking.landlordId._id.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(new ErrorResponse('Not authorized to view this booking', 403));
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /bookings
// @desc    Get bookings (for tenant or landlord)
// @access  Private
exports.getBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};

    if (req.user.role === 'tenant') {
      query.tenantId = req.user.id;
    } else if (req.user.role === 'landlord') {
      query.landlordId = req.user.id;
    }

    if (status) {
      query.bookingStatus = status;
    }

    const startIndex = (page - 1) * limit;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate([
        { path: 'tenantId', select: 'firstName lastName email profileImage phoneNumber' },
        { path: 'propertyId', select: 'title price location images propertyType' },
        { path: 'landlordId', select: 'firstName lastName email profileImage phoneNumber' },
      ])
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /bookings/:id/approve
// @desc    Approve booking request (Landlord only)
// @access  Private/Landlord
exports.approveBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new ErrorResponse('Booking not found', 404));
    }

    // Check authorization
    if (booking.landlordId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to approve this booking', 403));
    }

    if (booking.bookingStatus !== 'pending') {
      return next(new ErrorResponse('Only pending bookings can be approved', 400));
    }

    booking.bookingStatus = 'approved';
    await booking.save();

    await booking.populate([
      { path: 'tenantId', select: 'firstName lastName email' },
      { path: 'propertyId', select: 'title' },
      { path: 'landlordId', select: 'firstName lastName email' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Booking approved successfully',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /bookings/:id/reject
// @desc    Reject booking request (Landlord only)
// @access  Private/Landlord
exports.rejectBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new ErrorResponse('Booking not found', 404));
    }

    // Check authorization
    if (booking.landlordId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to reject this booking', 403));
    }

    if (booking.bookingStatus !== 'pending') {
      return next(new ErrorResponse('Only pending bookings can be rejected', 400));
    }

    booking.bookingStatus = 'rejected';
    await booking.save();

    await booking.populate([
      { path: 'tenantId', select: 'firstName lastName email' },
      { path: 'propertyId', select: 'title' },
      { path: 'landlordId', select: 'firstName lastName email' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Booking rejected successfully',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /bookings/:id/cancel
// @desc    Cancel booking (Tenant only)
// @access  Private/Tenant
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new ErrorResponse('Booking not found', 404));
    }

    // Check authorization
    if (booking.tenantId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to cancel this booking', 403));
    }

    if (booking.bookingStatus !== 'pending') {
      return next(new ErrorResponse('Only pending bookings can be cancelled', 400));
    }

    booking.bookingStatus = 'cancelled';
    await booking.save();

    await booking.populate([
      { path: 'tenantId', select: 'firstName lastName email' },
      { path: 'propertyId', select: 'title' },
      { path: 'landlordId', select: 'firstName lastName email' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /bookings/property/:propertyId
// @desc    Get all bookings for a property
// @access  Private/Landlord
exports.getPropertyBookings = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if property exists and user is landlord
    const property = await Property.findById(propertyId);
    if (!property) {
      return next(new ErrorResponse('Property not found', 404));
    }

    if (property.landlordId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to view these bookings', 403));
    }

    const startIndex = (page - 1) * limit;

    const total = await Booking.countDocuments({ propertyId });
    const bookings = await Booking.find({ propertyId })
      .populate('tenantId', 'firstName lastName email phoneNumber profileImage')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      bookings,
    });
  } catch (error) {
    next(error);
  }
};
