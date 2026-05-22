const ErrorResponse = require('../utils/errorResponse');

// Middleware to check if user has required role(s)
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this resource`,
          403
        )
      );
    }

    next();
  };
};

module.exports = authorize;
