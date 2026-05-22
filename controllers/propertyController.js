const Property = require('../models/Property');
const User = require('../models/User');
const Review = require('../models/Review');
const ErrorResponse = require('../utils/errorResponse');
const cloudinaryService = require('../services/cloudinaryService');
const { validateCoordinates, validatePrice, validatePropertySize } = require('../utils/validators');

// @route   POST /properties
// @desc    Create a new property (Landlord only)
// @access  Private/Landlord
exports.createProperty = async (req, res, next) => {
  try {
    const {
      title,
      description,
      propertyType,
      price,
      bedrooms,
      bathrooms,
      propertySize,
      sizeUnit,
      location,
      latitude,
      longitude,
      amenities,
      availableFrom,
    } = req.body;

    // Validation
    if (!title || !description || !propertyType || price === undefined || !bedrooms || !bathrooms || !propertySize || !location) {
      return next(new ErrorResponse('Please provide all required fields', 400));
    }

    if (!validateCoordinates(latitude, longitude)) {
      return next(new ErrorResponse('Invalid coordinates', 400));
    }

    if (!validatePrice(price)) {
      return next(new ErrorResponse('Price must be a positive number', 400));
    }

    if (!validatePropertySize(propertySize)) {
      return next(new ErrorResponse('Property size must be a positive number', 400));
    }

    // Create property
    const property = await Property.create({
      title,
      description,
      propertyType,
      price,
      bedrooms,
      bathrooms,
      propertySize,
      sizeUnit: sizeUnit || 'sqft',
      location,
      latitude,
      longitude,
      amenities: amenities || [],
      landlordId: req.user.id,
      availableFrom,
    });

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      try {
        const uploadedImages = await cloudinaryService.uploadMultipleImages(
          req.files.map((file) => file.path)
        );

        property.images = uploadedImages;
        await property.save();
      } catch (uploadError) {
        // Delete created property if image upload fails
        await Property.findByIdAndDelete(property._id);
        return next(uploadError);
      }
    }

    // Populate landlord info
    await property.populate('landlordId', 'firstName lastName profileImage email');

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      property,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /properties
// @desc    Get all properties with filters
// @access  Public
exports.getAllProperties = async (req, res, next) => {
  try {
    const {
      location,
      minPrice,
      maxPrice,
      minSize,
      propertyType,
      bedrooms,
      bathrooms,
      search,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isAvailable: true };

    // Filters
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = minPrice;
      if (maxPrice) query.price.$lte = maxPrice;
    }

    if (minSize) {
      query.propertySize = { $gte: minSize };
    }

    if (propertyType) {
      query.propertyType = propertyType;
    }

    if (bedrooms) {
      query.bedrooms = { $gte: bedrooms };
    }

    if (bathrooms) {
      query.bathrooms = { $gte: bathrooms };
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;

    // Sort options
    let sortOption = {};
    if (sort) {
      switch (sort) {
        case 'price_asc':
          sortOption = { price: 1 };
          break;
        case 'price_desc':
          sortOption = { price: -1 };
          break;
        case 'newest':
          sortOption = { createdAt: -1 };
          break;
        case 'rating':
          sortOption = { averageRating: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    } else {
      sortOption = { createdAt: -1 };
    }

    // Execute query
    const total = await Property.countDocuments(query);
    const properties = await Property.find(query)
      .populate('landlordId', 'firstName lastName profileImage email')
      .sort(sortOption)
      .skip(startIndex)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: properties.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      properties,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /properties/:id
// @desc    Get single property details
// @access  Public
exports.getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id).populate('landlordId', 'firstName lastName profileImage email phoneNumber bio');

    if (!property) {
      return next(new ErrorResponse('Property not found', 404));
    }

    // Get reviews for this property
    const reviews = await Review.find({ propertyId: req.params.id }).populate('tenantId', 'firstName lastName profileImage');

    res.status(200).json({
      success: true,
      property,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /properties/:id
// @desc    Update property (Landlord only)
// @access  Private/Landlord
exports.updateProperty = async (req, res, next) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return next(new ErrorResponse('Property not found', 404));
    }

    // Check authorization
    if (property.landlordId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to update this property', 403));
    }

    const {
      title,
      description,
      propertyType,
      price,
      bedrooms,
      bathrooms,
      propertySize,
      sizeUnit,
      location,
      latitude,
      longitude,
      amenities,
      isAvailable,
      availableFrom,
    } = req.body;

    // Validate coordinates if provided
    if ((latitude && longitude) || (!latitude && !longitude)) {
      if (latitude !== undefined && longitude !== undefined && !validateCoordinates(latitude, longitude)) {
        return next(new ErrorResponse('Invalid coordinates', 400));
      }
    }

    // Update fields
    if (title) property.title = title;
    if (description) property.description = description;
    if (propertyType) property.propertyType = propertyType;
    if (price !== undefined) {
      if (!validatePrice(price)) {
        return next(new ErrorResponse('Price must be a positive number', 400));
      }
      property.price = price;
    }
    if (bedrooms) property.bedrooms = bedrooms;
    if (bathrooms) property.bathrooms = bathrooms;
    if (propertySize) {
      if (!validatePropertySize(propertySize)) {
        return next(new ErrorResponse('Property size must be a positive number', 400));
      }
      property.propertySize = propertySize;
    }
    if (sizeUnit) property.sizeUnit = sizeUnit;
    if (location) property.location = location;
    if (latitude !== undefined) property.latitude = latitude;
    if (longitude !== undefined) property.longitude = longitude;
    if (amenities) property.amenities = amenities;
    if (isAvailable !== undefined) property.isAvailable = isAvailable;
    if (availableFrom) property.availableFrom = availableFrom;

    // Handle new images
    if (req.files && req.files.length > 0) {
      try {
        const uploadedImages = await cloudinaryService.uploadMultipleImages(
          req.files.map((file) => file.path)
        );

        property.images = [...property.images, ...uploadedImages];
        property.save();
      } catch (uploadError) {
        return next(uploadError);
      }
    }

    property = await property.save();
    await property.populate('landlordId', 'firstName lastName profileImage email');

    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      property,
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /properties/:id
// @desc    Delete property (Landlord only)
// @access  Private/Landlord
exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return next(new ErrorResponse('Property not found', 404));
    }

    // Check authorization
    if (property.landlordId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to delete this property', 403));
    }

    // Delete images from Cloudinary
    if (property.images && property.images.length > 0) {
      try {
        await Promise.all(property.images.map((img) => cloudinaryService.deleteImage(img.publicId)));
      } catch (deleteError) {
        console.error('Error deleting images:', deleteError);
      }
    }

    await Property.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /properties/landlord/:landlordId
// @desc    Get all properties of a landlord
// @access  Public
exports.getLandlordProperties = async (req, res, next) => {
  try {
    const { landlordId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const startIndex = (page - 1) * limit;

    const total = await Property.countDocuments({ landlordId });
    const properties = await Property.find({ landlordId })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: properties.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      properties,
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /properties/:id/images/:imageIndex
// @desc    Delete specific image from property
// @access  Private/Landlord
exports.deletePropertyImage = async (req, res, next) => {
  try {
    const { id, imageIndex } = req.params;

    const property = await Property.findById(id);

    if (!property) {
      return next(new ErrorResponse('Property not found', 404));
    }

    // Check authorization
    if (property.landlordId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to delete this property image', 403));
    }

    if (imageIndex < 0 || imageIndex >= property.images.length) {
      return next(new ErrorResponse('Invalid image index', 400));
    }

    const image = property.images[imageIndex];

    // Delete from Cloudinary
    try {
      await cloudinaryService.deleteImage(image.publicId);
    } catch (deleteError) {
      console.error('Error deleting image from Cloudinary:', deleteError);
    }

    property.images.splice(imageIndex, 1);
    await property.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      property,
    });
  } catch (error) {
    next(error);
  }
};
