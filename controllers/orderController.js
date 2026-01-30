const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const sendEmail = require("../utils/sendEmail");

// CREATE NEW ORDER
exports.newOrder = asyncErrorHandler(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    totalPrice,
  } = req.body;

  if (!shippingInfo || !orderItems || orderItems.length === 0) {
    return next(new ErrorHandler("Invalid Order Data", 400));
  }

  // 🔥 COD support
  let paidAt = null;
  let paymentStatus = "Pending";

  if (paymentInfo && paymentInfo.id !== "COD") {
    // Online payment
    paidAt = Date.now();
    paymentStatus = "Paid";
  }

  const order = await Order.create({
    shippingInfo,
    orderItems,
   paymentInfo: paymentInfo || {
  id: `COD_${Date.now()}`, // 🔥 UNIQUE
  status: "Cash On Delivery",
},

    totalPrice,
    paidAt,
    paymentStatus,
    user: req.user._id,
  });

  // Email send (optional)
  await sendEmail({
    email: req.user.email,
    templateId: process.env.SENDGRID_ORDER_TEMPLATEID,
    data: {
      name: req.user.name,
      shippingInfo,
      orderItems,
      totalPrice,
      oid: order._id,
    },
  });

  res.status(201).json({
    success: true,
    order,
  });
});

// GET SINGLE ORDER
exports.getSingleOrderDetails = asyncErrorHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("orderItems.product");

  if (!order) {
    return next(new ErrorHandler("Order Not Found", 404));
  }

  // 🔥 ADD isReviewed FLAG
order.orderItems = await Promise.all(
  order.orderItems.map(async (item) => {
   const reviewed = await Product.exists({
  _id: item.product._id,
  reviews: {
    $elemMatch: {
      user: req.user._id,
      order: order._id,
    },
  },
});


    return {
      ...item.toObject(),
      isReviewed: !!reviewed,
    };
  })
);


  res.status(200).json({
    success: true,
    order,
  });
});
;

// GET LOGGED IN USER ORDERS
exports.myOrders = asyncErrorHandler(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });

  res.status(200).json({
    success: true,
    orders,
  });
});

// GET ALL ORDERS --- ADMIN
exports.getAllOrders = asyncErrorHandler(async (req, res, next) => {
  const orders = await Order.find();

  let totalAmount = 0;
  orders.forEach((order) => {
    totalAmount += order.totalPrice;
  });

  res.status(200).json({
    success: true,
    orders,
    totalAmount,
  });
});

// UPDATE ORDER STATUS --- ADMIN
exports.updateOrder = asyncErrorHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order Not Found", 404));
  }

  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler("Already Delivered", 400));
  }

  const { status, courierName, trackingId } = req.body;

  // 🔥 When order is shipped
  if (status === "Shipped") {
    if (!courierName || !trackingId) {
      return next(
        new ErrorHandler("Courier name & Tracking ID required", 400)
      );
    }

    order.orderStatus = "Shipped";
    order.shippedAt = Date.now();
    order.courierName = courierName;
    order.trackingId = trackingId;

    // Reduce stock
    for (const item of order.orderItems) {
      await updateStock(item.product, item.quantity);
    }
  }

  // 🔥 When order is delivered
  if (status === "Delivered") {
    order.orderStatus = "Delivered";
    order.deliveredAt = Date.now();
  }

  await order.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    order,
  });
});


async function updateStock(id, quantity) {
  const product = await Product.findById(id);
  product.stock -= quantity;
  await product.save({ validateBeforeSave: false });
}

// DELETE ORDER --- ADMIN
exports.deleteOrder = asyncErrorHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order Not Found", 404));
  }

  await order.remove();

  res.status(200).json({
    success: true,
  });
});
