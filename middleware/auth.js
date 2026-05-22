const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new ErrorResponse('No token provided', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ErrorResponse('Token expired', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new ErrorResponse('Invalid token', 401));
    }
    next(error);
  }
};

module.exports = auth;
