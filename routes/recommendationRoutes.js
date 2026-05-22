const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const auth = require('../middleware/auth');

// Routes
router.post('/', auth, recommendationController.getRecommendations);
router.post('/filter', recommendationController.filterProperties);

module.exports = router;
