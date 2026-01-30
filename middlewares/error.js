const ErrorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Resource not found: ${err.path}`;
  }

  if (err.code === 11000) {
    statusCode = 400;
    message = `Duplicate ${Object.keys(err.keyValue)} entered`;
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid JWT Token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "JWT Token Expired";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
