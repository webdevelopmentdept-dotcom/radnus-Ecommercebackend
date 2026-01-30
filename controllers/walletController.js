const Razorpay = require("razorpay");
const crypto = require("crypto");
const Wallet = require("../models/walletModel");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🔹 Create Razorpay Order
exports.addMoney = async (req, res) => {
  const { amount } = req.body;

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: `wallet_${Date.now()}`,
  });

  res.status(200).json({
    orderId: order.id,
    amount: order.amount,
  });
};

// 🔹 Verify payment & credit wallet
exports.verifyPayment = async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    amount,
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false });
  }

  let wallet = await Wallet.findOne({ user: req.user._id });

  if (!wallet) {
    wallet = await Wallet.create({
      user: req.user._id,
      balance: 0,
      transactions: [],
    });
  }

  wallet.balance += Number(amount);
  wallet.transactions.push({
    amount,
    type: "credit",
    description: "Wallet top-up",
  });

  await wallet.save();

  res.status(200).json({
    success: true,
    balance: wallet.balance,
  });
};

// 🔹 Get wallet balance
exports.getWallet = async (req, res) => {
  let wallet = await Wallet.findOne({ user: req.user._id });

  if (!wallet) {
    wallet = await Wallet.create({
      user: req.user._id,
      balance: 0,
      transactions: [],
    });
  }

  res.status(200).json({
    success: true,
    balance: wallet.balance,
  });
};
// 🔹 ADMIN – Get all wallets with user details
exports.getAllWalletsAdmin = async (req, res) => {
  const wallets = await Wallet.find()
    .populate("user", "name email phone")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    wallets,
  });
};
