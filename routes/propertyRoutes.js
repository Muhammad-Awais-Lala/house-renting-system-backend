const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorization');
const upload = require('../middleware/multer');

// Public routes — specific paths MUST come before parameterized /:id
router.get('/landlord/:landlordId', propertyController.getLandlordProperties);
router.get('/', propertyController.getAllProperties);
router.get('/:id', propertyController.getPropertyById);

// Landlord routes
router.post('/', auth, authorize('landlord'), upload.array('images', 6), propertyController.createProperty);
router.put('/:id', auth, authorize('landlord'), upload.array('images', 6), propertyController.updateProperty);
router.delete('/:id', auth, authorize('landlord'), propertyController.deleteProperty);
router.delete('/:id/images/:imageIndex', auth, authorize('landlord'), propertyController.deletePropertyImage);

module.exports = router;
