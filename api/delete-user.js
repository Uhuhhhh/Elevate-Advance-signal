const { db } = require("../lib/firebaseAdmin");
const jwt = require("jsonwebtoken");

module.exports = async(req,res)=>{

try{

const token=req.headers.authorization?.replace("Bearer ","");

jwt.verify(token,process.env.JWT_SECRET);

const {id}=req.body;

await db.collection("users").doc(id).delete();

res.json({
success:true
});

}catch(err){

res.status(500).json({
success:false
});

}

};