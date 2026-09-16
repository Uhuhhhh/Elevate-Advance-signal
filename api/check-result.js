const { verifyToken } = require("../lib/auth");
const { db } = require("../lib/firebaseAdmin");

module.exports = async (req, res) => {

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "POST Only"
        });
    }

    try {

        // -----------------------------
        // AUTHENTICATION
        // -----------------------------

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Login Required"
            });
        }

        const token = authHeader.replace("Bearer ", "");

        const user = verifyToken(token);

        if (!user || !user.uid) {
            return res.status(401).json({
                success: false,
                message: "Invalid Token"
            });
        }

        // -----------------------------
        // FIREBASE USER CHECK
        // -----------------------------

        const userDoc = await db
            .collection("users")
            .doc(user.uid)
            .get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        const userData = userDoc.data();

        if (userData.premium !== true) {
            return res.status(403).json({
                success: false,
                message: "⭐ Premium Required"
            });
        }

        if (userData.expiry) {

            const premiumExpiry =
                new Date(userData.expiry);

            if (premiumExpiry < new Date()) {

                return res.status(403).json({
                    success: false,
                    message: "❌ Premium Expired"
                });

            }

        }

        // -----------------------------
        // REQUEST DATA
        // -----------------------------

        const {
            pair,
            signal,
            timeframe,
            entryPrice,
            expiryTimestamp
        } = req.body;

        if (
            !pair ||
            !signal ||
            !timeframe ||
            entryPrice === undefined ||
            !expiryTimestamp
        ) {

            return res.status(400).json({
                success: false,
                message: "Missing trade data"
            });

        }

        // -----------------------------
        // DON'T CHECK BEFORE EXPIRY
        // -----------------------------

        const expiryTime =
            Number(expiryTimestamp);

        const now = Date.now();

        if (now < expiryTime) {

            return res.status(200).json({
                success: false,
                pending: true,
                result: "Pending",
                message: "Trade has not expired yet"
            });

        }

        // -----------------------------
        // SYMBOL MAP
        // -----------------------------

        const symbolMap = {

            AUDCAD: "AUD/CAD",
            AUDCHF: "AUD/CHF",
            AUDJPY: "AUD/JPY",
            AUDUSD: "AUD/USD",

            CADCHF: "CAD/CHF",
            CADJPY: "CAD/JPY",

            CHFJPY: "CHF/JPY",

            EURAUD: "EUR/AUD",
            EURCAD: "EUR/CAD",
            EURCHF: "EUR/CHF",
            EURGBP: "EUR/GBP",
            EURJPY: "EUR/JPY",
            EURUSD: "EUR/USD",

            GBPAUD: "GBP/AUD",
            GBPCAD: "GBP/CAD",
            GBPCHF: "GBP/CHF",
            GBPJPY: "GBP/JPY",
            GBPUSD: "GBP/USD",

            USDCAD: "USD/CAD",
            USDCHF: "USD/CHF",
            USDJPY: "USD/JPY"

        };

        const symbol = symbolMap[pair];

        if (!symbol) {

            return res.status(400).json({
                success: false,
                message: "Unsupported market: " + pair
            });

        }

        // -----------------------------
        // TIMEFRAME
        // -----------------------------

        const intervalMap = {

            1: "1min",
            2: "2min",
            5: "5min",
            15: "15min"

        };

        const interval =
            intervalMap[Number(timeframe)];

        if (!interval) {

            return res.status(400).json({
                success: false,
                message: "Unsupported timeframe"
            });

        }

        // -----------------------------
        // FETCH MARKET DATA
        // -----------------------------

        const fetch = require("node-fetch");

        const url =
            `https://api.twelvedata.com/time_series` +
            `?symbol=${encodeURIComponent(symbol)}` +
            `&interval=${interval}` +
            `&outputsize=10` +
            `&apikey=${process.env.TWELVEDATA_API_KEY}`;

        const response = await fetch(url);

        const data = await response.json();

        if (!data.values || !data.values.length) {

            return res.status(500).json({
                success: false,
                message: "Unable to fetch expiry candle"
            });

        }

        // Twelve Data returns newest first
        const candles =
            data.values;

        // -----------------------------
        // FIND EXPIRY CANDLE
        // -----------------------------

        const expiryDate =
            new Date(expiryTime);

        let expiryCandle = null;

        let closestDifference = Infinity;

        for (const candle of candles) {

            const candleTime =
                new Date(candle.datetime);

            const difference =
                Math.abs(
                    candleTime.getTime() -
                    expiryDate.getTime()
                );

            if (difference < closestDifference) {

                closestDifference = difference;

                expiryCandle = candle;

            }

        }

        if (!expiryCandle) {

            return res.status(500).json({
                success: false,
                message: "Expiry candle not found"
            });

        }

        const expiryPrice =
            Number(expiryCandle.close);

        const startPrice =
            Number(entryPrice);

        if (
            !Number.isFinite(startPrice) ||
            !Number.isFinite(expiryPrice)
        ) {

            return res.status(500).json({
                success: false,
                message: "Invalid price"
            });

        }

        // -----------------------------
        // CALCULATE RESULT
        // -----------------------------

        let result;

        if (expiryPrice === startPrice) {

            result = "DRAW";

        }

        else if (signal === "CALL") {

            result =
                expiryPrice > startPrice
                    ? "WIN"
                    : "LOSS";

        }

        else if (signal === "PUT") {

            result =
                expiryPrice < startPrice
                    ? "WIN"
                    : "LOSS";

        }

        else {

            return res.status(400).json({
                success: false,
                message: "Invalid signal"
            });

        }

        // -----------------------------
        // RESPONSE
        // -----------------------------

        return res.status(200).json({

            success: true,

            pending: false,

            result,

            pair,

            signal,

            timeframe: Number(timeframe),

            entryPrice: startPrice,

            expiryPrice,

            expiryTimestamp: expiryTime

        });

    }

    catch (err) {

        console.error(
            "CHECK RESULT ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};