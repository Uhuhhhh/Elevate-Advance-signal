const { analyzeHistorical } = require("../lib/historicalStrategy");

module.exports = async (req, res) => {

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            message: "POST Only"
        });

    }

    try {

        const {

            pair,
            timeframe,
            days,
            startTime,
            endTime

        } = req.body;

        const result = await analyzeHistorical({

            pair,
            timeframe,
            days,
            startTime,
            endTime

        });

        return res.status(200).json({

            success: true,
            signals: result

        });

    } catch (err) {

        return res.status(500).json({

            success: false,
            message: err.message

        });

    }

};