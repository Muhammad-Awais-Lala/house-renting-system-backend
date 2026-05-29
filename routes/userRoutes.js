const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorization');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/role/:role', userController.getUsersByRole);

// Private routes
router.get('/:id', auth, userController.getUserProfile);
router.put('/:id', auth, userController.updateUserProfile);
router.put('/:id/password', auth, userController.changePassword);

// Admin routes
router.get('/', auth, authorize('admin'), userController.getAllUsers);
router.delete('/:id', auth, authorize('admin'), userController.deleteUser);

module.exports = router;
