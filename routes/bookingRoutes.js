const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorization');

// Specific routes MUST come before parameterized /:id
router.get('/property/:propertyId', auth, authorize('landlord', 'admin'), bookingController.getPropertyBookings);

// Private routes
router.get('/', auth, bookingController.getBookings);
router.get('/:id', auth, bookingController.getBookingById);

// Tenant / Admin routes
router.post('/', auth, authorize('tenant'), bookingController.createBooking);
router.put('/:id/cancel', auth, authorize('tenant', 'admin'), bookingController.cancelBooking);

// Landlord / Admin routes
router.put('/:id/approve', auth, authorize('landlord', 'admin'), bookingController.approveBooking);
router.put('/:id/reject', auth, authorize('landlord', 'admin'), bookingController.rejectBooking);

module.exports = router;
