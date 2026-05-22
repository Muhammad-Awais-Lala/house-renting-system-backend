const axios = require('axios');
const Property = require('../models/Property');
const ErrorResponse = require('../utils/errorResponse');

// Generate feature vector from user preferences
const generatePreferenceVector = (preferences) => {
  const { budget, location, propertySize, propertyType, bedrooms, bathrooms } = preferences;

  // Normalize values to create feature vector
  const vector = {
    budget: budget ? budget / 100000 : 0.5, // Normalize price
    propertySize: propertySize ? propertySize / 10000 : 0.5, // Normalize size
    bedrooms: bedrooms ? bedrooms / 5 : 0.5, // Normalize bedrooms
    bathrooms: bathrooms ? bathrooms / 5 : 0.5, // Normalize bathrooms
    location: location ? location.length / 100 : 0.5,
    type: propertyType || 'apartment',
  };

  return vector;
};

// Get recommendations from Hugging Face API
const getAIRecommendations = async (preferences) => {
  try {
    const preferenceVector = generatePreferenceVector(preferences);

    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${process.env.HUGGING_FACE_MODEL}`,
      {
        inputs: preferenceVector,
        options: {
          use_cache: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Hugging Face API error:', error.message);
    throw new ErrorResponse(`AI recommendation failed: ${error.message}`, 500);
  }
};

// Filter properties based on user preferences
const filterProperties = async (preferences) => {
  const { budget, location, propertySize, propertyType, bedrooms, bathrooms } = preferences;

  const query = {};

  if (budget) {
    query.price = { $lte: budget };
  }

  if (location) {
    query.location = { $regex: location, $options: 'i' };
  }

  if (propertySize) {
    query.propertySize = { $gte: propertySize };
  }

  if (propertyType) {
    query.propertyType = propertyType;
  }

  if (bedrooms) {
    query.bedrooms = { $gte: bedrooms };
  }

  if (bathrooms) {
    query.bathrooms = { $gte: bathrooms };
  }

  query.isAvailable = true;

  const properties = await Property.find(query).populate('landlordId', 'firstName lastName profileImage');

  return properties;
};

// Get recommendations combining AI and filter
const getRecommendations = async (preferences) => {
  try {
    // First, filter properties based on basic criteria
    const filteredProperties = await filterProperties(preferences);

    // Try to get AI recommendations
    let aiRecommendations = null;
    if (process.env.HUGGING_FACE_API_KEY && process.env.HUGGING_FACE_MODEL) {
      try {
        aiRecommendations = await getAIRecommendations(preferences);
      } catch (aiError) {
        console.warn('AI recommendation service unavailable, using filtered results only');
      }
    }

    // Sort by rating if available
    const recommendations = filteredProperties.sort((a, b) => b.averageRating - a.averageRating);

    return {
      success: true,
      count: recommendations.length,
      recommendations,
      aiInsights: aiRecommendations,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getRecommendations,
  filterProperties,
  generatePreferenceVector,
};
