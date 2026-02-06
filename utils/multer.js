const multer = require("multer");
const fs = require("fs");
const path = require("path");

// 🔥 ABSOLUTE BASE UPLOAD PATH
const baseUploadPath = path.join(__dirname, "..", "uploads");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = path.join(baseUploadPath, "others");

    if (file.fieldname === "images")
      uploadPath = path.join(baseUploadPath, "products");

    if (file.fieldname === "reviewImages")
      uploadPath = path.join(baseUploadPath, "reviews");

    if (file.fieldname === "logo")
      uploadPath = path.join(baseUploadPath, "brands");

    if (file.fieldname === "avatar")
      uploadPath = path.join(baseUploadPath, "avatars");

    // ✅ CREATE FOLDER IF NOT EXISTS
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const cleanName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${cleanName}`);
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
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
