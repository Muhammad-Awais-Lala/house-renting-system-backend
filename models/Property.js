const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Property title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    propertyType: {
      type: String,
      enum: ['apartment', 'house', 'condo', 'townhouse', 'studio', 'penthouse'],
      required: [true, 'Property type is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
    },
    bedrooms: {
      type: Number,
      required: [true, 'Number of bedrooms is required'],
      min: [0, 'Bedrooms cannot be negative'],
    },
    bathrooms: {
      type: Number,
      required: [true, 'Number of bathrooms is required'],
      min: [0, 'Bathrooms cannot be negative'],
    },
    propertySize: {
      type: Number, // in square feet/meters
      required: [true, 'Property size is required'],
      min: [0, 'Size must be positive'],
    },
    sizeUnit: {
      type: String,
      enum: ['sqft', 'sqm'],
      default: 'sqft',
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
    amenities: [
      {
        type: String,
        enum: [
          'wifi',
          'parking',
          'gym',
          'pool',
          'balcony',
          'garden',
          'ac',
          'heating',
          'washer',
          'dishwasher',
          'fireplace',
        ],
      },
    ],
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String, // Cloudinary public ID for deletion
        },
      },
    ],
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Landlord ID is required'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    availableFrom: {
      type: Date,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: [0, 'Reviews count cannot be negative'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for geospatial queries
propertySchema.index({ latitude: 1, longitude: 1 });

// Index for price range queries
propertySchema.index({ price: 1 });

// Index for location search
propertySchema.index({ location: 'text', title: 'text', description: 'text' });

// Index for landlord queries
propertySchema.index({ landlordId: 1 });

module.exports = mongoose.model('Property', propertySchema);
