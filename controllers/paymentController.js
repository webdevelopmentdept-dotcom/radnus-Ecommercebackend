const Razorpay = require("razorpay");
const crypto = require("crypto");
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const Payment = require("../models/paymentModel");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1️⃣ CREATE ORDER
exports.processPayment = async (req, res) => {
  try {
    const { amount } = req.body;

    console.log("AMOUNT RECEIVED:", amount);
    console.log("KEY ID:", process.env.RAZORPAY_KEY_ID);

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount missing",
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    console.log("ORDER CREATED:", order.id);

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("RAZORPAY ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// 2️⃣ VERIFY PAYMENT
exports.verifyPayment = asyncErrorHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false });
  }

  await Payment.create({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    status: "SUCCESS",
  });

  res.status(200).json({ success: true });
});