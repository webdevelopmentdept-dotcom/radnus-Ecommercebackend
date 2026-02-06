const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = "uploads/others";

    if (file.fieldname === "images") uploadPath = "uploads/products";
    if (file.fieldname === "reviewImages") uploadPath = "uploads/reviews";
    if (file.fieldname === "logo") uploadPath = "uploads/brands";
    if (file.fieldname === "avatar") uploadPath = "uploads/avatars";

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// ✅ only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files allowed"), false);
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});
