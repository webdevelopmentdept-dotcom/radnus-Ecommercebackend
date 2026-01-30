const mongoose = require("mongoose");

const supportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  orderId: {
    type: String,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "Pending", // Pending | In Progress | Resolved
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Support", supportSchema);
