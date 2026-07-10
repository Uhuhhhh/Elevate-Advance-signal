import { analyzeChart } from "../lib/aiVision.js";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method Not Allowed"
        });
    }

    try {

        const { image } = req.body;

        if (!image) {

            return res.status(400).json({
                error: "No image uploaded."
            });

        }

        // Limit image size
        if (image.length > 7000000) {

            return res.status(400).json({
                error: "Image too large."
            });

        }

        const result = await analyzeChart(image);
        
        

        return res.status(200).json(result);

    } catch (err) {

        console.error("Gemini Error:", err);

        return res.status(500).json({

            error: err.message || "Gemini analysis failed."

        });

    }

}