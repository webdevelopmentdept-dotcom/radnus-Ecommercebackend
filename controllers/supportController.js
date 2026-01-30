const Support = require("../models/supportModel");
const sendEmail = require("../utils/sendEmail");

exports.createSupport = async (req, res) => {
  try {
    const { name, contactNumber, orderId, message } = req.body;

    if (!name || !contactNumber || !message) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    // 1️⃣ Save to DB
    const support = await Support.create({
      name,
      contactNumber,
      orderId,
      message,
    });

    // 2️⃣ Send Email
    await sendEmail({
      email: process.env.MAIL_USER, // Admin email
      subject: "New Customer Support Request",
      message: `
New support request received:

Name: ${name}
Contact Number: ${contactNumber}
Order ID: ${orderId || "N/A"}

Message:
${message}
      `,
    });

    // 3️⃣ Response
    res.status(201).json({
      success: true,
      message: "Support request submitted successfully",
    });
  } catch (error) {
    console.error("Support Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
