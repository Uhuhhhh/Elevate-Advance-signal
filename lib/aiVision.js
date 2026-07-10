export async function analyzeChart(imageBase64) {

    const apiKey = process.env.GEMINI_API_KEY;

    const base64 = imageBase64.split(",")[1];

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: `You are Elevate AI Professional Trading Analyzer.

Analyze the uploaded chart carefully.

Detect:

1. Trading Signal
- CALL
- PUT
- WAIT

2. Confidence (0-100)

3. Trend
- Bullish
- Bearish
- Sideways

4. Candlestick Pattern
- Bullish Engulfing
- Bearish Engulfing
- Hammer
- Shooting Star
- Doji
- Pin Bar
- Morning Star
- Evening Star
- Tweezer Top
- Tweezer Bottom
- Three White Soldiers
- Three Black Crows
- Inside Bar
- Outside Bar
- Marubozu

5. Market Structure
- Higher High
- Higher Low
- Lower High
- Lower Low

6. Price Action
- BOS
- CHOCH
- Liquidity Sweep
- Fake Breakout
- Support
- Resistance
- Supply Zone
- Demand Zone

7. Indicators (only if visible)
- EMA20
- EMA50
- EMA200
- RSI
- MACD
- Bollinger Bands
- ATR
- Momentum
- Volume

8. Trade

Entry

Expiry

Risk

Summary

Return ONLY JSON.

{
"signal":"",
"confidence":0,
"entry":"",

"expiry":"",

"trend":"",

"candlestick":"",

"marketStructure":"",

"bos":"",

"choch":"",

"support":"",

"resistance":"",

"supply":"",

"demand":"",

"liquiditySweep":"",

"fakeBreakout":"",

"ema20":"",

"ema50":"",

"ema200":"",

"rsi":"",

"macd":"",

"bollinger":"",

"atr":"",

"volume":"",

"momentum":"",

"risk":"",

"summary":"",

"reason":[]
}`
                        },
                        {
                            inline_data: {
                                mime_type: "image/png",
                                data: base64
                            }
                        }
                    ]
                }]
            })
        }
    );

    if (!response.ok) {
        throw new Error(await response.text());
    }

    const data = await response.json();

    let text = data.candidates[0].content.parts[0].text;

    text = text.replace(/```json/g, "")
               .replace(/```/g, "")
               .trim();

    return JSON.parse(text);
}