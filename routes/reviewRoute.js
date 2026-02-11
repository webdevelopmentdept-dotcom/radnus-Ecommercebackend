const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");


const {
  createReviewAfterDelivery,
  getReviewsByProduct,
  deleteReview,
   getAllReviewsAdmin,
} = require("../controllers/reviewController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

// ================= CREATE REVIEW (AFTER DELIVERY) =================
router.post(
  "/review/delivered",
  isAuthenticatedUser,
   upload.array("images", 5),
  createReviewAfterDelivery
);

// ================= GET REVIEWS BY PRODUCT =================
router.get(
  "/reviews",
  getReviewsByProduct
);

// ================= DELETE REVIEW (ADMIN) =================
router.delete(
  "/reviews/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  deleteReview
);

// 🔥 ADMIN – GET ALL REVIEWS
router.get(
  "/admin/reviews",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  getAllReviewsAdmin
);


module.exports = router;
