const { db } = require("../lib/firebaseAdmin");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

module.exports = async (req, res) => {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false
    });
  }

  try {

    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    jwt.verify(token, process.env.JWT_SECRET);

    const {
      id,
      password,
      deviceId,
      premium,
      enabled,
      expiry
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID missing"
      });
    }

    const updateData = {};

    if (password && password.trim() !== "") {

      updateData.passwordHash = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");

    }

    if (deviceId !== undefined)
      updateData.deviceId = deviceId;

    if (premium !== undefined)
      updateData.premium = premium;

    if (enabled !== undefined)
      updateData.enabled = enabled;

    if (expiry !== undefined)
      updateData.expiry = expiry;

    await db
      .collection("users")
      .doc(id)
      .update(updateData);

    res.json({
      success: true,
      message: "User Updated"
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

};