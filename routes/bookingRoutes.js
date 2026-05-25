const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorization');

// Specific routes MUST come before parameterized /:id
router.get('/property/:propertyId', auth, authorize('landlord'), bookingController.getPropertyBookings);

// Private routes
router.get('/', auth, bookingController.getBookings);
router.get('/:id', auth, bookingController.getBookingById);

// Tenant routes
router.post('/', auth, authorize('tenant'), bookingController.createBooking);
router.put('/:id/cancel', auth, authorize('tenant'), bookingController.cancelBooking);

// Landlord routes
router.put('/:id/approve', auth, authorize('landlord'), bookingController.approveBooking);
router.put('/:id/reject', auth, authorize('landlord'), bookingController.rejectBooking);

module.exports = router;
