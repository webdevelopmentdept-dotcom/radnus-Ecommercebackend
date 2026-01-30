const express = require("express");
const router = express.Router();
const { addToCart } = require("../controllers/cartController");
const { isAuthenticatedUser } = require("../middlewares/auth");

router.post("/cart/add", isAuthenticatedUser, addToCart);

module.exports = router;
