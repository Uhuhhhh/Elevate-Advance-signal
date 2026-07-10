const { db } = require("../lib/firebaseAdmin");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

module.exports = async (req, res) => {

  if (req.method !== "POST") {
    return res.status(405).json({ success: false });
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
  password,
  deviceId,
  premium,
  enabled,
  expiry
} = req.body;

    if (!password || !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Password and Device ID are required"
      });
    }

    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    await db.collection("users").add({

  passwordHash,

  deviceId,

  premium: premium ?? false,

  enabled: enabled ?? true,

  expiry: expiry || null,

  createdAt: Date.now()

});

    res.json({

      success: true,

      message: "User Created"

    });

  } catch (err) {

    res.status(500).json({

      success: false,

      error: err.message

    });

  }

};