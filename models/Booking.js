const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
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
    moveInDate: {
      type: Date,
      required: [true, 'Move-in date is required'],
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
    },
    numberOfOccupants: {
      type: Number,
      required: [true, 'Number of occupants is required'],
      min: [1, 'At least one occupant is required'],
    },
    messageToLandlord: {
      type: String,
      trim: true,
    },
    bookingStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Index for queries
bookingSchema.index({ tenantId: 1, propertyId: 1 });
bookingSchema.index({ landlordId: 1 });
bookingSchema.index({ propertyId: 1 });
bookingSchema.index({ bookingStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
