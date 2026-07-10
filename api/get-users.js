const { db } = require("../lib/firebaseAdmin");
const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {

    try {

        const token = req.headers.authorization?.replace("Bearer ","");

        jwt.verify(token, process.env.JWT_SECRET);

        const snap = await db.collection("users").get();

        let users = [];

        snap.forEach(doc=>{

            users.push({
                id:doc.id,
                ...doc.data()
            });

        });

        res.json(users);

    } catch (error) {
    console.error(error);

    return res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack
    });
}

};