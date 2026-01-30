const express = require("express");
const { createSupport } = require("../controllers/supportController");

const router = express.Router();

router.post("/support", createSupport);

module.exports = router;
