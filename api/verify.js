const jwt = require("jsonwebtoken");

module.exports = function(req,res){

    const token =
    req.headers.authorization?.replace("Bearer ","");

    if(!token){

        return res.status(401).json({
            success:false,
            message:"Unauthorized"
        });

    }

    try{

        const decoded =
        jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        return res.status(200).json({

    success: true,

    premium: decoded.premium || false,

    key: decoded.key || "",

    expiry: decoded.expiry || "Unlimited",

    user: decoded

});

    }catch(e){

        return res.status(401).json({
            success:false,
            message:"Invalid Token"
        });

    }

}