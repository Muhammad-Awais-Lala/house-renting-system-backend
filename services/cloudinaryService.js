const cloudinary = require('../config/cloudinary');
const ErrorResponse = require('../utils/errorResponse');

const uploadImage = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'intelligent-house-renting',
      resource_type: 'auto',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    throw new ErrorResponse(`Image upload failed: ${error.message}`, 500);
  }
};

const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new ErrorResponse(`Image deletion failed: ${error.message}`, 500);
  }
};

const uploadMultipleImages = async (filePaths) => {
  try {
    const uploadPromises = filePaths.map((filePath) => uploadImage(filePath));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    throw new ErrorResponse(`Multiple images upload failed: ${error.message}`, 500);
  }
};

module.exports = {
  uploadImage,
  deleteImage,
  uploadMultipleImages,
};
