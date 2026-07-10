const { db } = require("../lib/firebaseAdmin");
const { createToken } = require("../lib/auth");
const crypto = require("crypto");

module.exports = async (req, res) => {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false
    });
  }

  try {

    const {
      password,
      deviceId
    } = req.body;

    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const snap = await db
      .collection("users")
      .where("passwordHash", "==", passwordHash)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(401).json({
        success: false,
        message: "Wrong Password"
      });
    }

    const doc = snap.docs[0];

    const user = doc.data();

    if (
      user.deviceId &&
      user.deviceId !== deviceId
    ) {
      return res.status(403).json({
        success: false,
        message: "Wrong Device"
      });
    }

    if (
      user.enabled === false ||
      user.enabled === "false"
    ) {
      return res.status(403).json({
        success: false,
        message: "Account Disabled"
      });
    }

    const token = createToken({
      uid: doc.id,
      email: user.email || ""
    });

    return res.json({
      success: true,
      token,
      premium: user.premium === true || user.premium === "true"
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      error: err.message
    });

  }

};