const express = require("express");
const router = express.Router();
const {
  processPayment,
  verifyPayment,
} = require("../controllers/paymentController");

router.post("/payment/process", processPayment);
router.post("/payment/verify", verifyPayment);

module.exports = router;