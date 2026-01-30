const User = require("../models/userModel");
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const sendToken = require("../utils/sendToken");
const ErrorHandler = require("../utils/errorHandler");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");


// ================= REGISTER USER =================
exports.registerUser = asyncErrorHandler(async (req, res) => {
  const { name, email, gender, password } = req.body;

  const avatar = req.file
    ? {
        public_id: req.file.filename,
        url: `/uploads/avatars/${req.file.filename}`,
      }
    : {
        public_id: "default",
        url: "/uploads/avatars/default.png",
      };

 const user = await User.create({
  name,
  email,
  gender,
  password,
  avatar,
  role: "normal", // force default
});


  sendToken(user, 201, res);
});


// ================= LOGIN =================
exports.loginUser = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email And Password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  sendToken(user, 200, res);
});


// ================= LOGOUT =================
exports.logoutUser = asyncErrorHandler(async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({ success: true });
});


// ================= LOAD USER =================
exports.getUserDetails = asyncErrorHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, user });
});


// ================= FORGOT PASSWORD =================
exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User Not Found", 404));
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `http://${req.get("host")}/password/reset/${resetToken}`;

  await sendEmail({
    email: user.email,
    templateId: process.env.SENDGRID_RESET_TEMPLATEID,
    data: { reset_url: resetPasswordUrl },
  });

  res.status(200).json({
    success: true,
    message: `Email sent to ${user.email}`,
  });
});


// ================= RESET PASSWORD =================
exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler("Invalid reset password token", 404));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
  sendToken(user, 200, res);
});


// ================= UPDATE PASSWORD =================
exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.comparePassword(req.body.oldPassword))) {
    return next(new ErrorHandler("Old Password is Invalid", 400));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendToken(user, 200, res);
});


// ================= UPDATE PROFILE =================
exports.updateProfile = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  user.name = req.body.name || user.name;

  if (req.file) {
    // delete old avatar
    if (user.avatar?.url && !user.avatar.url.includes("default")) {
      const oldPath = path.join("backend", user.avatar.url);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    user.avatar = {
      public_id: req.file.filename,
      url: `/uploads/avatars/${req.file.filename}`,
    };
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
  });
});


// ================= ADMIN =================
exports.getAllUsers = asyncErrorHandler(async (req, res) => {
  const users = await User.find();
  res.status(200).json({ success: true, users });
});

exports.getSingleUser = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  res.status(200).json({ success: true, user });
});

exports.updateUserRole = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  let newRole = req.body.role;

  // backward compatibility
  if (newRole === "user" || newRole === "customer") {
    newRole = "normal";
  }

  if (user.role !== newRole) {
    user.role = newRole;
    user.showRoleUpgradeMsg = true;
    user.tokenVersion += 1;
  }

  await user.save();

  // ✅ THIS IS THE FIX
  res.status(200).json({
    success: true,
    message: "User updated successfully",
  });
});




exports.deleteUser = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (user.avatar?.url && !user.avatar.url.includes("default")) {
    const imgPath = path.join("backend", user.avatar.url);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  await user.deleteOne();

  res.status(200).json({ success: true });
});

// ================= CLEAR ROLE UPGRADE MESSAGE =================
exports.clearRoleUpgradeMsg = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  user.showRoleUpgradeMsg = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Upgrade message cleared",
  });
});

