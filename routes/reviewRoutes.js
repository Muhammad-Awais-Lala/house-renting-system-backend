const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorization');

// Public routes
router.get('/property/:propertyId', reviewController.getPropertyReviews);
router.get('/tenant/:tenantId', reviewController.getTenantReviews);
router.get('/:id', reviewController.getReviewById);

// Tenant routes
router.post('/', auth, authorize('tenant'), reviewController.createReview);
router.put('/:id', auth, authorize('tenant'), reviewController.updateReview);
router.delete('/:id', auth, authorize('tenant'), reviewController.deleteReview);

// Public routes for helpfulness
router.put('/:id/helpful', reviewController.markHelpful);

module.exports = router;
