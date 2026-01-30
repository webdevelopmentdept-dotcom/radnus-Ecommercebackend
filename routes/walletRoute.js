const express = require("express");
const {
  addMoney,
  verifyPayment,
  getWallet,
  getAllWalletsAdmin,
} = require("../controllers/walletController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

const router = express.Router();

// USER
router.post("/wallet/add-money", isAuthenticatedUser, addMoney);
router.post("/wallet/verify-payment", isAuthenticatedUser, verifyPayment);
router.get("/wallet/me", isAuthenticatedUser, getWallet);

// ADMIN
router.get(
  "/admin/wallets",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  getAllWalletsAdmin
);

module.exports = router;
