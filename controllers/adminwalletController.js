const Wallet = require("../models/walletModel");

exports.getAllWallets = async (req, res) => {
  const wallets = await Wallet.find()
    .populate("user", "name email");

  res.status(200).json({
    success: true,
    wallets,
  });
};
