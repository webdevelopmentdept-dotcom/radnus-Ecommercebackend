const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ErrorHandler = require('../utils/errorHandler');
const asyncErrorHandler = require('./asyncErrorHandler');

exports.isAuthenticatedUser = asyncErrorHandler(async (req, res, next) => {

    const { token } = req.cookies;

    if (!token) {
        return next(new ErrorHandler("Please Login to Access", 401));
    }

    let decodedData;
    try {
        decodedData = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return next(new ErrorHandler("Session expired, please login again", 401));
    }

    const user = await User.findById(decodedData.id);

    if (!user) {
        return next(new ErrorHandler("User not found", 401));
    }

    // 🔥 FORCE LOGOUT AFTER ROLE CHANGE
    if (decodedData.tokenVersion !== user.tokenVersion) {
        return next(
            new ErrorHandler("Session expired due to role update. Please login again.", 401)
        );
    }

    req.user = user;
    next();
});


exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {

        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role: ${req.user.role} is not allowed`, 403));
        }
        next();
    }
}