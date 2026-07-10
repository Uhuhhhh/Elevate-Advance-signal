const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false
    });
  }

  try {

    const { password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {

      return res.status(401).json({
        success: false,
        message: "Wrong Admin Password"
      });

    }

    const token = jwt.sign(

      {
        role: "admin"
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d"
      }

    );

    res.json({

      success: true,

      token

    });

  } catch (err) {

    res.status(500).json({

      success: false,

      error: err.message

    });

  }

};