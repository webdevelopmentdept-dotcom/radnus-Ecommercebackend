const express = require("express");
const cloudinary = require("cloudinary");

const app = require("./app");
const connectDatabase = require("./config/database");

// 🔹 Connect DB
connectDatabase();

// 🔹 Cloudinary config (Render env vars)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔹 Health check route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// 🔹 Port (Render assigns automatically)
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 🔹 Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
