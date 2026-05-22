const Review = require('../models/Review');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const ErrorResponse = require('../utils/errorResponse');
const { validateRating } = require('../utils/validators');

// @route   POST /reviews
// @desc    Create a review (Tenant only)
// @access  Private/Tenant
exports.createReview = async (req, res, next) => {
  try {
    const { propertyId, rating, title, comment, pros, cons } = req.body;

    // Validation
    if (!propertyId || !rating || !title || !comment) {
      return next(new ErrorResponse('Please provide all required fields', 400));
    }

    if (!validateRating(rating)) {
      return next(new ErrorResponse('Rating must be between 1 and 5', 400));
    }

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return next(new ErrorResponse('Property not found', 404));
    }

    // Check if tenant has booked this property (verified tenant)
    const booking = await Booking.findOne({
      tenantId: req.user.id,
      propertyId,
      status: 'accepted',
    });

    const isVerifiedTenant = !!booking;

    // Create review
    const review = await Review.create({
      propertyId,
      tenantId: req.user.id,
      landlordId: property.landlordId,
      rating,
      title,
      comment,
      pros: pros || [],
      cons: cons || [],
      isVerifiedTenant,
    });

    // Update property average rating
    const reviews = await Review.find({ propertyId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    property.averageRating = avgRating;
    property.totalReviews = reviews.length;
    await property.save();

    await review.populate('tenantId', 'firstName lastName profileImage');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ErrorResponse('You have already reviewed this property', 400));
    }
    next(error);
  }
};

// @route   GET /reviews/property/:propertyId
// @desc    Get all reviews for a property
// @access  Public
exports.getPropertyReviews = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { page = 1, limit = 10, sortBy = 'newest' } = req.query;

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return next(new ErrorResponse('Property not found', 404));
    }

    const startIndex = (page - 1) * limit;

    let sortOption = {};
    switch (sortBy) {
      case 'highest':
        sortOption = { rating: -1 };
        break;
      case 'lowest':
        sortOption = { rating: 1 };
        break;
      case 'helpful':
        sortOption = { helpful: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const total = await Review.countDocuments({ propertyId });
    const reviews = await Review.find({ propertyId })
      .populate('tenantId', 'firstName lastName profileImage')
      .sort(sortOption)
      .skip(startIndex)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /reviews/:id
// @desc    Get single review
// @access  Public
exports.getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id).populate([
      { path: 'tenantId', select: 'firstName lastName profileImage' },
      { path: 'propertyId', select: 'title' },
      { path: 'landlordId', select: 'firstName lastName email' },
    ]);

    if (!review) {
      return next(new ErrorResponse('Review not found', 404));
    }

    res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /reviews/:id
// @desc    Update review (Tenant only)
// @access  Private/Tenant
exports.updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return next(new ErrorResponse('Review not found', 404));
    }

    // Check authorization
    if (review.tenantId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to update this review', 403));
    }

    const { rating, title, comment, pros, cons } = req.body;

    if (rating !== undefined) {
      if (!validateRating(rating)) {
        return next(new ErrorResponse('Rating must be between 1 and 5', 400));
      }
      review.rating = rating;
    }

    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (pros) review.pros = pros;
    if (cons) review.cons = cons;

    review = await review.save();

    // Update property average rating
    const reviews = await Review.find({ propertyId: review.propertyId });
    const property = await Property.findById(review.propertyId);
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    property.averageRating = avgRating;
    await property.save();

    await review.populate('tenantId', 'firstName lastName profileImage');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /reviews/:id
// @desc    Delete review (Tenant only)
// @access  Private/Tenant
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(new ErrorResponse('Review not found', 404));
    }

    // Check authorization
    if (review.tenantId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to delete this review', 403));
    }

    const propertyId = review.propertyId;

    await Review.findByIdAndDelete(req.params.id);

    // Update property average rating
    const reviews = await Review.find({ propertyId });
    const property = await Property.findById(propertyId);

    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      property.averageRating = avgRating;
      property.totalReviews = reviews.length;
    } else {
      property.averageRating = 0;
      property.totalReviews = 0;
    }

    await property.save();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Public
exports.markHelpful = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpful: 1 } },
      { new: true }
    ).populate('tenantId', 'firstName lastName profileImage');

    if (!review) {
      return next(new ErrorResponse('Review not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Review marked as helpful',
      review,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /reviews/tenant/:tenantId
// @desc    Get all reviews by a tenant
// @access  Public
exports.getTenantReviews = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const startIndex = (page - 1) * limit;

    const total = await Review.countDocuments({ tenantId });
    const reviews = await Review.find({ tenantId })
      .populate('propertyId', 'title')
      .populate('tenantId', 'firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      reviews,
    });
  } catch (error) {
    next(error);
  }
};
