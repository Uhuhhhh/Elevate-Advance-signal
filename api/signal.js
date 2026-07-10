const { analyzeMarket } = require("../lib/strategyEngine");
const { verifyToken } = require("../lib/auth");
const { db } = require("../lib/firebaseAdmin");

module.exports = async (req, res) => {

    if(req.method !== "POST"){

        return res.status(405).json({
            success:false,
            message:"POST Only"
        });

    }

    try{

        const authHeader = req.headers.authorization;

        if(!authHeader){

            return res.status(401).json({
                success:false,
                message:"Login Required"
            });

        }

        const token = authHeader.replace("Bearer ","");

        const user = verifyToken(token);

const userDoc = await db
    .collection("users")
    .doc(user.uid)
    .get();

if(!userDoc.exists){

    return res.status(404).json({

        success:false,

        message:"User Not Found"

    });

}

const userData = userDoc.data();

if(userData.premium !== true){

    return res.status(403).json({

        success:false,

        message:"⭐ Premium Required"

    });

}

if(userData.expiry){

    const expiry = new Date(userData.expiry);

    if(expiry < new Date()){

        return res.status(403).json({

            success:false,

            message:"❌ Premium Expired"

        });

    }

}

        const fetch = require("node-fetch");

const {

    timeframe,

    market

} = req.body;

const symbolMap = {

    AUDCAD:"AUD/CAD",
    AUDCHF:"AUD/CHF",
    AUDJPY:"AUD/JPY",
    AUDUSD:"AUD/USD",

    CADCHF:"CAD/CHF",
    CADJPY:"CAD/JPY",

    CHFJPY:"CHF/JPY",

    EURAUD:"EUR/AUD",
    EURCAD:"EUR/CAD",
    EURCHF:"EUR/CHF",
    EURGBP:"EUR/GBP",
    EURJPY:"EUR/JPY",
    EURUSD:"EUR/USD",

    GBPAUD:"GBP/AUD",
    GBPCAD:"GBP/CAD",
    GBPCHF:"GBP/CHF",
    GBPJPY:"GBP/JPY",
    GBPUSD:"GBP/USD",

    USDCAD:"USD/CAD",
    USDCHF:"USD/CHF",
    USDJPY:"USD/JPY"

};

const intervalMap={

    1:"1min",
    2:"2min",
    5:"5min",
    15:"15min"

};

const symbol=symbolMap[market];

const interval=
intervalMap[timeframe] || "1min";

const url=
`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=5000&apikey=${process.env.TWELVEDATA_API_KEY}`;

const response=
await fetch(url);

const data=
await response.json();

if(!data.values){

    return res.status(500).json({

        success:false,

        message:"Unable to fetch candles"

    });

}

const candles=data.values.reverse();

        const result = analyzeMarket(

            candles,

            timeframe,

            market

        );

        return res.status(200).json(result);

    }catch(err){

        return res.status(500).json({

            success:false,

            message:err.message

        });

    }

};