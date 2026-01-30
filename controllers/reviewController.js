const Review = require("../models/reviewModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");

// ================= CREATE REVIEW (AFTER DELIVERY) =================
exports.createReviewAfterDelivery = async (req, res) => {
  try {
    const { rating, comment, productId, orderId } = req.body;




    // BASIC VALIDATION
    if (!rating || !comment || !productId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "rating, comment, productId & orderId required",
      });
    }

        let images = [];

if (req.files && req.files.length > 0) {
  images = req.files.map((file) => ({
    public_id: file.filename,
    url: `/uploads/reviews/${file.filename}`,
  }));
}

    // AUTH CHECK
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // ORDER CHECK
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not allowed to review this order",
      });
    }

    if (order.orderStatus.toLowerCase() !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Review allowed only after delivery",
      });
    }

    // PRODUCT CHECK
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // PRODUCT IN ORDER CHECK
    const orderedItem = order.orderItems.find(
      (item) => item.product.toString() === productId
    );

    if (!orderedItem) {
      return res.status(400).json({
        success: false,
        message: "Product not found in this order",
      });
    }

    // SAVE REVIEW (UNIQUE INDEX WILL PREVENT DUPLICATE)
    const review = await Review.create({
  user: req.user._id,
  product: productId,
  order: orderId,
  rating: Number(rating),
  comment,
  images, // 🔥 ADD THIS
});

// 🔥 UPDATE PRODUCT RATING & REVIEW COUNT
const reviews = await Review.find({ product: productId });

const avg =
  reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

await Product.findByIdAndUpdate(productId, {
  ratings: avg,
  numOfReviews: reviews.length,
});



    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
    });

  } catch (error) {
    // DUPLICATE REVIEW ERROR
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You already reviewed this product for this order",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET REVIEWS BY PRODUCT =================
exports.getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId required",
      });
    }

    const reviews = await Review.find({ product: productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE REVIEW (ADMIN) =================
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: "Review deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET ALL REVIEWS (ADMIN) =================
exports.getAllReviewsAdmin = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user", "name")
      .populate("product", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


