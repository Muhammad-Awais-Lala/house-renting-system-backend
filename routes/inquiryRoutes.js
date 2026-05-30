const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiryController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorization');

// Public route to submit contact inquiry
router.post('/', inquiryController.createInquiry);

// Admin only routes to manage contact inquiries
router.get('/', auth, authorize('admin'), inquiryController.getAllInquiries);
router.get('/:id', auth, authorize('admin'), inquiryController.getInquiryById);
router.delete('/:id', auth, authorize('admin'), inquiryController.deleteInquiry);

module.exports = router;
