const validateEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateCoordinates = (latitude, longitude) => {
  return (
    latitude !== undefined &&
    longitude !== undefined &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

const validatePrice = (price) => {
  return price && !isNaN(price) && price > 0;
};

const validatePropertySize = (size) => {
  return size && !isNaN(size) && size > 0;
};

const validateRating = (rating) => {
  return rating >= 1 && rating <= 5;
};

const validateUserRole = (role) => {
  return ['tenant', 'landlord', 'admin'].includes(role);
};

const validatePropertyType = (type) => {
  return ['apartment', 'house', 'condo', 'townhouse', 'studio', 'penthouse'].includes(type);
};

module.exports = {
  validateEmail,
  validatePassword,
  validateCoordinates,
  validatePrice,
  validatePropertySize,
  validateRating,
  validateUserRole,
  validatePropertyType,
};
