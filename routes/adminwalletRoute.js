const express = require("express");
const { getAllWallets } = require("../controllers/adminwalletController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

const router = express.Router();

router.get(
  "/admin/wallets",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  getAllWallets
);

module.exports = router;
