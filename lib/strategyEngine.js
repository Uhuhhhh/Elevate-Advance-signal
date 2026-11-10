// =======================================================
// ELEVATE AI V30
// PART 1
// CORE ENGINE + HISTORICAL MATCHING
// =======================================================

function num(v){
    return parseFloat(v);
}

function closeArray(candles){
    return candles.map(c=>num(c.close));
}

function openArray(candles){
    return candles.map(c=>num(c.open));
}

function highArray(candles){
    return candles.map(c=>num(c.high));
}

function lowArray(candles){
    return candles.map(c=>num(c.low));
}

// =========================================
// ENTRY / EXPIRY — 5-minute candles, 5-minute expiry
// =========================================
function getTradeTime(tf=5){
    const barMinutes = Number(tf) || 5;
    const barMs = barMinutes * 60 * 1000;
    const now = Date.now();
    const entryTimestamp = Math.floor(now / barMs) * barMs + barMs;
    const expiryTimestamp = entryTimestamp + barMs;

    function formatIST(timestamp){
        return new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }).format(new Date(timestamp));
    }

    return {
        entry: formatIST(entryTimestamp),
        expiry: formatIST(expiryTimestamp),
        entryTimestamp,
        expiryTimestamp
    };
}

// =========================================
// VOLATILITY
// =========================================

function averageRange(candles, period=20){

    let total=0;

    for(let i=candles.length-period;i<candles.length;i++){

        total +=
        Math.abs(
            num(candles[i].high)-
            num(candles[i].low)
        );

    }

    return total/period;

}

// =========================================
// SIMPLE TREND
// =========================================

function detectTrend(closes){

    const last=closes.length-1;

    const recent=
    closes[last]-closes[last-20];

    if(recent>0)
        return "UP";

    if(recent<0)
        return "DOWN";

    return "SIDEWAYS";

}

// =========================================
// NORMALIZED CANDLE PATTERN + HISTORICAL MATCHING
// Assumes candles are ordered oldest -> newest and are CLOSED candles.
// For 5m candles with 5m expiry, outcome is the next candle close.
// =========================================
function patternFeatures(candles, start, size=20){
    const subset = candles.slice(start, start + size);
    const ranges = subset.map(c => Math.max(num(c.high)-num(c.low), 1e-12));
    const sorted = [...ranges].sort((a,b)=>a-b);
    const medianRange = sorted[Math.floor(sorted.length/2)] || 1e-12;

    return subset.map(c => {
        const o=num(c.open), h=num(c.high), l=num(c.low), cl=num(c.close);
        const range=Math.max(h-l,1e-12);
        return [
            (cl-o)/range,
            (h-Math.max(o,cl))/range,
            (Math.min(o,cl)-l)/range,
            (cl-l)/range,
            Math.min(range/medianRange,3)/3
        ];
    });
}

function comparePatterns(a,b){
    if(!a.length || a.length!==b.length) return 0;
    const weights=[1.2,1,1,1,0.8];
    let distance=0;
    for(let i=0;i<a.length;i++){
        for(let j=0;j<weights.length;j++){
            distance += Math.abs(a[i][j]-b[i][j])*weights[j];
        }
    }
    const maxDistance=a.length*weights.reduce((x,y)=>x+y,0);
    return Math.max(0,100*(1-distance/maxDistance));
}

function historicalSimilarity(candles, expiryBars=1){
    const SIZE=20;
    const MIN_SIMILARITY=65;
    const n=candles.length;
    const currentStart=n-SIZE;
    const matches=[];
    if(n < SIZE*3+expiryBars) return matches;

    const current=patternFeatures(candles,currentStart,SIZE);

    // i is the historical entry candle index. Its outcome is known at
    // i+expiryBars-1, which must be strictly before the current pattern.
    // Non-overlapping windows reduce duplicate/overlapping samples.
    for(let i=SIZE; i+expiryBars-1<currentStart; i+=SIZE){
        const historicalPattern=patternFeatures(candles,i-SIZE,SIZE);
        const similarity=comparePatterns(current,historicalPattern);
        if(similarity<MIN_SIMILARITY) continue;

        const entryClose=num(candles[i-1].close);
        const outcomeClose=num(candles[i+expiryBars-1].close);
        if(!Number.isFinite(entryClose) || !Number.isFinite(outcomeClose) || entryClose===outcomeClose) continue;

        matches.push({
            similarity,
            direction:outcomeClose>entryClose?"CALL":"PUT",
            entryClose,
            expiryClose:outcomeClose
        });
    }
    return matches;
}

function wilsonLowerBound(wins,total,z=1.96){
    if(!total) return 0;
    const p=wins/total, z2=z*z;
    const denominator=1+z2/total;
    const centre=p+z2/(2*total);
    const margin=z*Math.sqrt((p*(1-p)/total)+(z2/(4*total*total)));
    return Math.max(0,(centre-margin)/denominator);
}

function similarityScore(matches, breakEvenRate=0.5556){
    if(!matches.length){
        return {direction:null,winRate:0,confidence:0,matches:0,
            weightedWinRate:0,lowerBound:0,edgeConfirmed:false,callCount:0,putCount:0};
    }

    let call=0,put=0,callCount=0,putCount=0,totalWeight=0;
    for(const m of matches){
        const weight=Math.max(0,Math.min(1,m.similarity/100));
        totalWeight+=weight;
        if(m.direction==="CALL"){call+=weight;callCount++;}
        else {put+=weight;putCount++;}
    }

    const direction=call>=put?"CALL":"PUT";
    const wins=direction==="CALL"?callCount:putCount;
    const winningWeight=direction==="CALL"?call:put;
    const winRate=100*wins/matches.length;
    const weightedWinRate=totalWeight?100*winningWeight/totalWeight:0;
    const lowerBound=wilsonLowerBound(wins,matches.length);

    return {
        direction, winRate, weightedWinRate,
        confidence:Math.round(weightedWinRate),
        matches:matches.length, lowerBound:lowerBound*100,
        edgeConfirmed:matches.length>=30 && lowerBound>breakEvenRate,
        callCount,putCount
    };
}

// =======================================================
// ELEVATE AI V30
// PART 2
// SMART PRICE ACTION ENGINE
// =======================================================

// =========================================
// SWING HIGH / LOW
// =========================================

function getSwingHigh(candles, left = 2, right = 2){

    let swings = [];

    for(let i = left; i < candles.length-right; i++){

        const high = num(candles[i].high);

        let valid = true;

        for(let j = 1; j <= left; j++){

            if(high <= num(candles[i-j].high)){
                valid = false;
                break;
            }

        }

        if(!valid) continue;

        for(let j = 1; j <= right; j++){

            if(high <= num(candles[i+j].high)){
                valid = false;
                break;
            }

        }

        if(valid){

            swings.push({
                index:i,
                price:high
            });

        }

    }

    return swings;

}

function getSwingLow(candles, left = 2, right = 2){

    let swings = [];

    for(let i = left; i < candles.length-right; i++){

        const low = num(candles[i].low);

        let valid = true;

        for(let j = 1; j <= left; j++){

            if(low >= num(candles[i-j].low)){
                valid = false;
                break;
            }

        }

        if(!valid) continue;

        for(let j = 1; j <= right; j++){

            if(low >= num(candles[i+j].low)){
                valid = false;
                break;
            }

        }

        if(valid){

            swings.push({
                index:i,
                price:low
            });

        }

    }

    return swings;

}

// =========================================
// MARKET STRUCTURE
// =========================================

function detectMarketStructure(candles){

    const highs = getSwingHigh(candles);
    const lows  = getSwingLow(candles);

    let hh = 0;
    let lh = 0;
    let hl = 0;
    let ll = 0;

    for(let i=1;i<highs.length;i++){

        if(highs[i].price > highs[i-1].price)
            hh++;
        else
            lh++;

    }

    for(let i=1;i<lows.length;i++){

        if(lows[i].price > lows[i-1].price)
            hl++;
        else
            ll++;

    }

    let trend="SIDEWAYS";

    if(hh>lh && hl>ll)
        trend="UP";

    if(lh>hh && ll>hl)
        trend="DOWN";

    return{

        trend,
        hh,
        hl,
        lh,
        ll

    };

}

// =========================================
// BREAK OF STRUCTURE
// =========================================

function detectBOS(candles){

    const highs=getSwingHigh(candles);
    const lows=getSwingLow(candles);

    if(highs.length<2 || lows.length<2){

        return{

            bullish:false,
            bearish:false

        };

    }

    const lastClose=
    num(candles[candles.length-1].close);

    const previousHigh=
    highs[highs.length-1].price;

    const previousLow=
    lows[lows.length-1].price;

    return{

        bullish:lastClose>previousHigh,

        bearish:lastClose<previousLow

    };

}

// =========================================
// CHANGE OF CHARACTER
// =========================================

function detectCHOCH(candles){

    const structure=
    detectMarketStructure(candles);

    const bos=
    detectBOS(candles);

    let direction="NONE";

    if(structure.trend==="DOWN" && bos.bullish)
        direction="CALL";

    if(structure.trend==="UP" && bos.bearish)
        direction="PUT";

    return{

        direction,

        bullish:
        direction==="CALL",

        bearish:
        direction==="PUT"

    };

}

// =========================================
// LIQUIDITY SWEEP
// =========================================

function detectLiquiditySweep(candles){

    const last=
    candles[candles.length-1];

    const previous=
    candles[candles.length-2];

    const high=
    num(last.high);

    const low=
    num(last.low);

    const close=
    num(last.close);

    const prevHigh=
    num(previous.high);

    const prevLow=
    num(previous.low);

    let bullish=false;
    let bearish=false;

    if(low<prevLow && close>prevLow){

        bullish=true;

    }

    if(high>prevHigh && close<prevHigh){

        bearish=true;

    }

    return{

        bullish,

        bearish

    };

}

// =========================================
// SUPPORT / RESISTANCE
// =========================================
// =========================================
// REAL SUPPORT / RESISTANCE ZONES
// =========================================

function detectSupportResistance(candles){

    const closes = closeArray(candles);

    const avgRange = averageRange(candles);

    const zoneSize = avgRange * 1.2;

    let levels = [];

    // -----------------------
    // Find Pivot Highs/Lows
    // -----------------------

    for(let i=5;i<candles.length-5;i++){

        const high = num(candles[i].high);
        const low  = num(candles[i].low);

        let pivotHigh = true;
        let pivotLow  = true;

        for(let j=1;j<=5;j++){

            if(high <= num(candles[i-j].high)) pivotHigh=false;
            if(high <= num(candles[i+j].high)) pivotHigh=false;

            if(low >= num(candles[i-j].low)) pivotLow=false;
            if(low >= num(candles[i+j].low)) pivotLow=false;

        }

        if(pivotHigh){
            levels.push({
                price:high,
                type:"R"
            });
        }

        if(pivotLow){
            levels.push({
                price:low,
                type:"S"
            });
        }

    }

    // -----------------------
    // Merge nearby levels
    // -----------------------

    let zones=[];

    levels.forEach(level=>{

        let found=false;

        for(const zone of zones){

            if(
                zone.type===level.type &&
                Math.abs(zone.price-level.price)<=zoneSize
            ){

                zone.price=(zone.price*zone.touches+level.price)/(zone.touches+1);
                zone.touches++;

                found=true;
                break;

            }

        }

        if(!found){

            zones.push({

                type:level.type,

                price:level.price,

                touches:1

            });

        }

    });

    // -----------------------
    // Keep only strong zones
    // -----------------------

    zones = zones.filter(z=>z.touches>=3);

    let support=null;
    let resistance=null;

    const lastClose=num(candles[candles.length-1].close);

    const lastHigh=num(candles[candles.length-1].high);

    const lastLow=num(candles[candles.length-1].low);

    const lastOpen=num(candles[candles.length-1].open);

    // Nearest support

    let bestSupportDistance=999999;

    zones.forEach(z=>{

        if(z.type!="S") return;

        const d=Math.abs(lastClose-z.price);

        if(d<bestSupportDistance){

            bestSupportDistance=d;
            support=z;

        }

    });

    // Nearest resistance

    let bestResistanceDistance=999999;

    zones.forEach(z=>{

        if(z.type!="R") return;

        const d=Math.abs(lastClose-z.price);

        if(d<bestResistanceDistance){

            bestResistanceDistance=d;
            resistance=z;

        }

    });

    // -----------------------
    // Bounce confirmation
    // -----------------------

    let supportBounce=false;
    let resistanceBounce=false;

    if(support){

        if(

            lastLow<support.price &&
            lastClose>support.price &&
            (lastOpen-lastLow)<
            (lastClose-lastLow)

        ){

            supportBounce=true;

        }

    }

    if(resistance){

        if(

            lastHigh>resistance.price &&
            lastClose<resistance.price &&
            (lastHigh-lastOpen)<
            (lastHigh-lastClose)

        ){

            resistanceBounce=true;

        }

    }

    return{

        supportLevel:support?support.price:null,

        resistanceLevel:resistance?resistance.price:null,

        supportTouches:support?support.touches:0,

        resistanceTouches:resistance?resistance.touches:0,

        support:supportBounce,

        resistance:resistanceBounce

    };

}

// =======================================================
// ELEVATE AI V30
// PART 3
// CONFLUENCE ENGINE
// =======================================================

// =========================================
// TREND CONTINUATION
// =========================================

function detectTrendContinuation(candles){

    const closes = closeArray(candles);

    const trend = detectTrend(closes);

    const last = num(candles[candles.length-1].close);

    const previous = num(candles[candles.length-2].close);

    let signal = "NONE";

    if(trend=="UP" && last>previous)
        signal="CALL";

    if(trend=="DOWN" && last<previous)
        signal="PUT";

    return{

        trend,

        signal

    };

}

// =========================================
// CANDLE CLUSTER
// =========================================

function analyzeCluster(candles,size=5){

    let bulls=0;
    let bears=0;

    for(
        let i=candles.length-size;
        i<candles.length;
        i++
    ){

        if(
            num(candles[i].close)>
            num(candles[i].open)
        )
            bulls++;
        else
            bears++;

    }

    let direction="NONE";

    if(bulls>bears)
        direction="CALL";

    if(bears>bulls)
        direction="PUT";

    return{

        bulls,

        bears,

        direction

    };

}

// =========================================
// BUY / SELL PRESSURE
// =========================================

function tickPressure(candles){

    let buy=0;
    let sell=0;

    for(
        let i=candles.length-20;
        i<candles.length;
        i++
    ){

        const body=Math.abs(

            num(candles[i].close)-

            num(candles[i].open)

        );

        if(
            num(candles[i].close)>
            num(candles[i].open)
        ){

            buy+=body;

        }else{

            sell+=body;

        }

    }

    let direction="NONE";

    if(buy>sell)
        direction="CALL";

    if(sell>buy)
        direction="PUT";

    return{

        buy,

        sell,

        direction

    };

}

// =========================================
// VOLATILITY FILTER
// =========================================

// =========================================
// REAL VOLATILITY FILTER (ATR Based)
// =========================================

function volatilityFilter(candles, period = 14){

    if(candles.length < period + 2){

        return{
            atr:0,
            currentRange:0,
            ratio:0,
            status:"UNKNOWN"
        };

    }

    let trs = [];

    for(let i=1;i<candles.length;i++){

        const high = num(candles[i].high);
        const low = num(candles[i].low);
        const prevClose = num(candles[i-1].close);

        const tr = Math.max(
            high-low,
            Math.abs(high-prevClose),
            Math.abs(low-prevClose)
        );

        trs.push(tr);

    }

    const recent = trs.slice(-period);

    const atr =
        recent.reduce((a,b)=>a+b,0)/period;

    const currentRange =
        num(candles[candles.length-1].high) -
        num(candles[candles.length-1].low);

    const ratio = currentRange / atr;

    let status = "GOOD";

    if(ratio < 0.60){

        status = "LOW";

    }else if(ratio > 1.80){

        status = "HIGH";

    }

    return{

        atr,

        currentRange,

        ratio,

        status

    };

}

// =========================================
// REAL ADX (Wilder)
// =========================================

function calculateADX(candles, period = 14){

    if(candles.length < period * 3){

        return {
            value:0,
            plusDI:0,
            minusDI:0,
            trend:"NONE"
        };

    }

    let tr = [];
    let plusDM = [];
    let minusDM = [];

    for(let i=1;i<candles.length;i++){

        const high = num(candles[i].high);
        const low = num(candles[i].low);

        const prevHigh = num(candles[i-1].high);
        const prevLow = num(candles[i-1].low);
        const prevClose = num(candles[i-1].close);

        const upMove = high - prevHigh;
        const downMove = prevLow - low;

        plusDM.push(
            (upMove > downMove && upMove > 0)
                ? upMove
                : 0
        );

        minusDM.push(
            (downMove > upMove && downMove > 0)
                ? downMove
                : 0
        );

        tr.push(
            Math.max(
                high-low,
                Math.abs(high-prevClose),
                Math.abs(low-prevClose)
            )
        );

    }

    const atr =
        tr.slice(-period)
        .reduce((a,b)=>a+b,0)/period;

    const plus =
        plusDM.slice(-period)
        .reduce((a,b)=>a+b,0);

    const minus =
        minusDM.slice(-period)
        .reduce((a,b)=>a+b,0);

    const plusDI = (plus/period)/atr*100;
    const minusDI = (minus/period)/atr*100;

    const dx =
        Math.abs(plusDI-minusDI)/
        (plusDI+minusDI)*100;

    let trend="SIDEWAYS";

    if(plusDI>minusDI)
        trend="UP";

    if(minusDI>plusDI)
        trend="DOWN";

    return{

        value:Math.round(dx),

        plusDI:Number(plusDI.toFixed(2)),

        minusDI:Number(minusDI.toFixed(2)),

        trend

    };

}

// =========================================
// TIME FILTER
// =========================================

function timeFilter(){

    const now=new Date(
        new Date().toLocaleString(
            "en-US",
            {
                timeZone:"Asia/Kolkata"
            }
        )
    );

    const hour=now.getHours();

    let score=0;

    if(hour>=8 && hour<=12)
        score=100;

    else if(hour>=13 && hour<=17)
        score=90;

    else if(hour>=18 && hour<=21)
        score=75;

    else
        score=50;

    return{

        hour,

        score

    };

}

// =========================================
// CONFLUENCE SCORE — NOT win probability
// =========================================
function calculateAIConfidence(data){
    const direction=data.history.direction;
    if(!direction) return {score:0,label:"NO EDGE"};
    const up=direction==="CALL";
    let score=0;

    // Historical statistical edge (25)
    if(data.history.edgeConfirmed) score+=25;

    // Structure (15)
    const expectedTrend=up?"UP":"DOWN";
    if(data.structure.trend===expectedTrend) score+=15;
    else if(data.structure.trend!=="SIDEWAYS") score-=8;

    // BOS (10)
    if((up && data.bos.bullish)||(!up && data.bos.bearish)) score+=10;
    else score-=3;

    // CHOCH (8)
    if(data.choch.direction===direction) score+=8;

    // Liquidity sweep (10)
    if((up && data.sweep.bullish)||(!up && data.sweep.bearish)) score+=10;

    // Support / resistance rejection (8)
    if((up && data.sr.support)||(!up && data.sr.resistance)) score+=8;

    // Trend continuation (8)
    if(data.trend.signal===direction) score+=8;
    else if(data.trend.signal!=="NONE") score-=5;

    // Candle cluster and body pressure (10)
    if(data.cluster.direction===direction) score+=5;
    if(data.pressure.direction===direction) score+=5;

    // ADX is strength, not direction (3)
    if(data.adx.value>=25) score+=3;

    // Volatility suitability (3)
    if(data.volatility.status==="GOOD") score+=3;
    else if(data.volatility.status==="HIGH") score-=8;
    else if(data.volatility.status==="LOW") score-=5;

    score=Math.max(0,Math.min(100,Math.round(score)));
    let label="LOW CONFLUENCE";
    if(score>=80) label="STRONG CONFLUENCE";
    else if(score>=70) label="GOOD CONFLUENCE";
    else if(score>=60) label="MODERATE CONFLUENCE";
    return {score,label};
}

// =======================================================
// ELEVATE AI V30
// PART 4
// MAIN ANALYZE FUNCTION
// =======================================================

function analyzeMarket(candles, timeframe, market){
    if(!Array.isArray(candles) || candles.length<500){
        return {success:false,message:"At least 500 historical candles are required."};
    }

    // This engine is configured for 5-minute candles and one-candle expiry.
    // The caller must supply completed candles in oldest -> newest order.
    const candleMinutes=Number(timeframe)||5;
    if(candleMinutes!==5){
        return {success:false,message:"V30 is configured for 5-minute candles only."};
    }

    const requiredFields=["open","high","low","close"];
    for(const c of candles){
        if(!c || requiredFields.some(k=>!Number.isFinite(num(c[k])))){
            return {success:false,message:"Invalid candle data. Check OHLC values and candle ordering."};
        }
        if(num(c.high)<Math.max(num(c.open),num(c.close)) ||
           num(c.low)>Math.min(num(c.open),num(c.close)) ||
           num(c.high)<num(c.low)){
            return {success:false,message:"Invalid OHLC candle detected."};
        }
    }

    const tradeTime=getTradeTime(5);
    const PAYOUT_RATE=0.80; // Change to the actual broker payout for this asset.
    const breakEvenRate=1/(1+PAYOUT_RATE);

    const historyMatches=historicalSimilarity(candles,1);
    const history=similarityScore(historyMatches,breakEvenRate);

    const structure=detectMarketStructure(candles);
    const bos=detectBOS(candles);
    const choch=detectCHOCH(candles);
    const sweep=detectLiquiditySweep(candles);
    const sr=detectSupportResistance(candles);
    const trend=detectTrendContinuation(candles);
    const cluster=analyzeCluster(candles);
    const pressure=tickPressure(candles);
    const volatility=volatilityFilter(candles);
    const adx=calculateADX(candles);
    const time=timeFilter();

    const ai=calculateAIConfidence({
        history,structure,bos,choch,sweep,sr,trend,cluster,
        pressure,volatility,adx,time
    });

    const expectedTrend=history.direction==="CALL"?"UP":"DOWN";
    const structureAgrees=history.direction && structure.trend===expectedTrend;
    const canTrade=history.edgeConfirmed && history.matches>=30 &&
                   structureAgrees && ai.score>=70 &&
                   volatility.status!=="HIGH" && volatility.status!=="LOW";

    const lastClose=num(candles[candles.length-1].close);
    const common={
        pair:market,
        confidence:ai.score,
        confidenceLabel:ai.label,
        trend:structure.trend,
        matches:history.matches,
        historicalWinRate:history.winRate.toFixed(1),
        weightedHistoricalWinRate:history.weightedWinRate.toFixed(1),
        historicalLowerBound:history.lowerBound.toFixed(1),
        historicalEdgeConfirmed:history.edgeConfirmed,
        historicalCallMatches:history.callCount,
        historicalPutMatches:history.putCount,
        entry:tradeTime.entry,
        expiry:tradeTime.expiry,
        entryTimestamp:tradeTime.entryTimestamp,
        expiryTimestamp:tradeTime.expiryTimestamp,
        entryPrice:lastClose,
        marketStructure:{hh:structure.hh,hl:structure.hl,lh:structure.lh,ll:structure.ll},
        bos,choch,liquiditySweep:sweep,supportResistance:sr,
        trendContinuation:trend.signal,
        clusterDirection:cluster.direction,
        tickPressure:pressure.direction,
        volatility:volatility.status,
        analysisTime:time.hour,
        scoreType:"CONFLUENCE_NOT_WIN_PROBABILITY"
    };

    if(!canTrade){
        let reason="Market evidence is not sufficiently aligned.";
        if(!history.edgeConfirmed) reason="No statistically validated historical edge for this pattern.";
        else if(!structureAgrees) reason="Historical direction conflicts with market structure.";
        else if(volatility.status==="HIGH" || volatility.status==="LOW") reason="Volatility conditions are unsuitable.";
        else if(ai.score<70) reason="Confluence score is below the 70-point threshold.";
        return {success:true,signal:"WAIT",message:reason,...common};
    }

    return {success:true,signal:history.direction,message:"Conditions passed the configured filters.",...common};
}

module.exports = {

    analyzeMarket

};
