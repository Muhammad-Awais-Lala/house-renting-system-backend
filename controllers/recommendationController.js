const recommendationService = require('../services/recommendationService');
const ErrorResponse = require('../utils/errorResponse');

// @route   POST /recommendations
// @desc    Get AI-based property recommendations
// @access  Private
exports.getRecommendations = async (req, res, next) => {
  try {
    const preferences = req.body;

    if (!preferences || Object.keys(preferences).length === 0) {
      return next(new ErrorResponse('Please provide at least one preference', 400));
    }

    const recommendations = await recommendationService.getRecommendations(preferences);

    res.status(200).json({
      success: true,
      ...recommendations,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /recommendations/filter
// @desc    Get filtered properties based on criteria
// @access  Public
exports.filterProperties = async (req, res, next) => {
  try {
    const preferences = req.body;

    if (!preferences || Object.keys(preferences).length === 0) {
      return next(new ErrorResponse('Please provide at least one filter criteria', 400));
    }

    const properties = await recommendationService.filterProperties(preferences);

    res.status(200).json({
      success: true,
      count: properties.length,
      properties,
    });
  } catch (error) {
    next(error);
  }
};
