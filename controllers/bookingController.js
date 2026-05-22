const Booking = require('../models/Booking');
const Property = require('../models/Property');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @route   POST /bookings
// @desc    Create a booking request (Tenant only)
// @access  Private/Tenant
exports.createBooking = async (req, res, next) => {
  try {
    const { propertyId, checkInDate, checkOutDate, numberOfGuests, message } = req.body;

    // Validation
    if (!propertyId || !checkInDate || !checkOutDate || !numberOfGuests) {
      return next(new ErrorResponse('Please provide all required fields', 400));
    }

    // Get property
    const property = await Property.findById(propertyId);
    if (!property) {
      return next(new ErrorResponse('Property not found', 404));
    }

    // Check if property is available
    if (!property.isAvailable) {
      return next(new ErrorResponse('Property is not available', 400));
    }

    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) {
      return next(new ErrorResponse('Check-in date must be before check-out date', 400));
    }

    if (checkIn < new Date()) {
      return next(new ErrorResponse('Check-in date cannot be in the past', 400));
    }

    // Calculate total price (for now, per night)
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPrice = property.price * nights;

    // Create booking
    const booking = await Booking.create({
      tenantId: req.user.id,
      propertyId,
      landlordId: property.landlordId,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      totalPrice,
      message,
      status: 'pending',
    });

    await booking.populate([
      { path: 'tenantId', select: 'firstName lastName email phoneNumber profileImage' },
      { path: 'propertyId', select: 'title price location' },
      { path: 'landlordId', select: 'firstName lastName email' },
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
      { path: 'landlordId', select: 'firstName lastName email' },
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
      query.status = status;
    }

    const startIndex = (page - 1) * limit;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate([
        { path: 'tenantId', select: 'firstName lastName email profileImage' },
        { path: 'propertyId', select: 'title price location images' },
        { path: 'landlordId', select: 'firstName lastName email' },
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

// @route   PUT /bookings/:id/accept
// @desc    Accept booking request (Landlord only)
// @access  Private/Landlord
exports.acceptBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new ErrorResponse('Booking not found', 404));
    }

    // Check authorization
    if (booking.landlordId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to accept this booking', 403));
    }

    if (booking.status !== 'pending') {
      return next(new ErrorResponse('Only pending bookings can be accepted', 400));
    }

    booking.status = 'accepted';
    await booking.save();

    await booking.populate([
      { path: 'tenantId', select: 'firstName lastName email' },
      { path: 'propertyId', select: 'title' },
      { path: 'landlordId', select: 'firstName lastName email' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Booking accepted successfully',
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
    const { rejectionReason } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new ErrorResponse('Booking not found', 404));
    }

    // Check authorization
    if (booking.landlordId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to reject this booking', 403));
    }

    if (booking.status !== 'pending') {
      return next(new ErrorResponse('Only pending bookings can be rejected', 400));
    }

    booking.status = 'rejected';
    if (rejectionReason) {
      booking.rejectionReason = rejectionReason;
    }

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

    if (booking.status !== 'pending' && booking.status !== 'accepted') {
      return next(new ErrorResponse('Cannot cancel this booking', 400));
    }

    booking.status = 'cancelled';
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
