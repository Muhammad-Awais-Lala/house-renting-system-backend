const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property ID is required'],
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tenant ID is required'],
    },
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Landlord ID is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    title: {
      type: String,
      required: [true, 'Review title is required'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    pros: [
      {
        type: String,
        maxlength: [50, 'Pro cannot exceed 50 characters'],
      },
    ],
    cons: [
      {
        type: String,
        maxlength: [50, 'Con cannot exceed 50 characters'],
      },
    ],
    isVerifiedTenant: {
      type: Boolean,
      default: false,
    },
    helpful: {
      type: Number,
      default: 0,
      min: [0, 'Helpful count cannot be negative'],
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

// Index for queries
reviewSchema.index({ propertyId: 1, rating: 1 });
reviewSchema.index({ tenantId: 1 });
reviewSchema.index({ landlordId: 1 });

// Prevent duplicate reviews from same tenant for same property
reviewSchema.index({ propertyId: 1, tenantId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
