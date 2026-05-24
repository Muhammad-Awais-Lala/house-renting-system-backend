const cloudinary = require('../config/cloudinary');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Upload a single image buffer to Cloudinary via upload_stream.
 * @param {Buffer} buffer  – the file buffer from multer memoryStorage
 * @param {string} [originalname] – optional original filename (for logging)
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadImageBuffer = (buffer, originalname = '') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'intelligent-house-renting',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(
            new ErrorResponse(`Image upload failed: ${error.message}`, 500)
          );
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    stream.end(buffer);
  });
};

/**
 * Upload multiple file buffers to Cloudinary in parallel.
 * @param {Array<{buffer: Buffer, originalname?: string}>} files – multer file objects
 * @returns {Promise<Array<{url: string, publicId: string}>>}
 */
const uploadMultipleBuffers = async (files) => {
  try {
    const results = await Promise.all(
      files.map((file) => uploadImageBuffer(file.buffer, file.originalname))
    );
    return results;
  } catch (error) {
    throw new ErrorResponse(
      `Multiple images upload failed: ${error.message}`,
      500
    );
  }
};

/**
 * Delete a single image from Cloudinary by its public ID.
 */
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new ErrorResponse(`Image deletion failed: ${error.message}`, 500);
  }
};

module.exports = {
  uploadImageBuffer,
  uploadMultipleBuffers,
  deleteImage,
};
