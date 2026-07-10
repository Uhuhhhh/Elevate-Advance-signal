const fetch = require("node-fetch");

const API_KEY = "e4d1a31ba8224449a266f6e6852bd491";

async function analyzeHistorical(options){

    const {

        pair,
        timeframe,
        days,
        startTime,
        endTime

    } = options;

    const outputsize = Number(days) * 1440;

    const symbol = pair;

const url =
`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${timeframe}&outputsize=${outputsize}&apikey=${API_KEY}`;

    const response = await fetch(url);

    const data = await response.json();

    if(!data.values){

        throw new Error("Historical candles not found.");

    }

    const candles = data.values.reverse();

    const signals = [];

    const startMinute = toMinute(startTime);

    const endMinute = toMinute(endTime);

    for(let minute = startMinute; minute <= endMinute; minute++){

        const history = [];

        for(let d = 1; d <= Number(days); d++){

            const candle = getSameTimeCandle(
                candles,
                minute,
                d
            );

            if(!candle) continue;

            history.push(

                candle.close > candle.open
                ? "G"
                : "R"

            );

        }

        if(history.length !== Number(days))
            continue;

        const green =
        history.every(x => x === "G");

        const red =
        history.every(x => x === "R");

        if(!green && !red)
            continue;

        signals.push({

            pair,

            timeframe,

            entry: minuteToTime(minute),

            signal: green ? "CALL" : "PUT",

            confidence: 100,

            history

        });

    }

    return signals;

}

function getSameTimeCandle(candles, minuteOfDay, dayBack){

    const groups = {};

    candles.forEach(c => {

        const dt = new Date(c.datetime);

        const date =
        dt.toISOString().split("T")[0];

        if(!groups[date])
            groups[date] = [];

        groups[date].push(c);

    });

    const dates =
    Object.keys(groups).sort();

    const index =
    dates.length - dayBack;

    if(index < 0)
        return null;

    const dayCandles =
    groups[dates[index]];

    return dayCandles.find(c => {

        const dt =
        new Date(c.datetime);

        return dt.getHours()*60 +
               dt.getMinutes()
               === minuteOfDay;

    });

}

function toMinute(time){

    const p = time.split(":");

    return Number(p[0])*60 +
           Number(p[1]);

}

function minuteToTime(min){

    const h =
    String(Math.floor(min/60))
    .padStart(2,"0");

    const m =
    String(min%60)
    .padStart(2,"0");

    return h + ":" + m;

}

module.exports = {

    analyzeHistorical

};