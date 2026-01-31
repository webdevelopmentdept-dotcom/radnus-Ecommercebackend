const path = require("path");

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// 🔥 LOAD ENV FIRST (THIS WAS MISSING)
require("dotenv").config({
  path: path.join(__dirname, "config", "config.env"),
});

const express = require("express");
const cloudinary = require("cloudinary");

const app = require("./app");
const connectDatabase = require("./config/database");

// 🔹 Connect DB
connectDatabase();

// 🔹 Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔹 Health check
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// 🔹 Port
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("RAZORPAY KEY:", process.env.RAZORPAY_KEY_ID); // 🔍 debug
});

// 🔹 Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
