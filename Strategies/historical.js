document
.getElementById("analyzeBtn")
.addEventListener("click", analyze);

async function analyze(){

    const pair =
    document.getElementById("pair").value;

    const timeframe =
    document.getElementById("timeframe").value;

    const days =
    document.getElementById("days").value;

    const startTime =
    document.getElementById("startTime").value;

    const endTime =
    document.getElementById("endTime").value;

    document.getElementById("loading").innerHTML =
    "Downloading historical candles...";

    const response =
    await fetch("/api/historical",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            pair,
            timeframe,
            days,
            startTime,
            endTime

        })

    });

    const result = await response.json();

if (!result.success) {

    document.getElementById("loading").innerHTML =
    result.message;

    return;

}

document.getElementById("loading").innerHTML =
"Analysis Complete";

showSignals(result.signals);

function showSignals(signals){

    const tbody =
    document.getElementById("results");

    tbody.innerHTML = "";

    if(!signals || signals.length===0){

        tbody.innerHTML =

        `<tr>

        <td colspan="5">

        No Historical Signal Found

        </td>

        </tr>`;

        return;

    }

    signals.forEach(signal=>{

        tbody.innerHTML += `

        <tr>

        <td>${signal.pair}</td>

        <td>${signal.timeframe}</td>

        <td>${signal.entry}</td>

        <td style="color:${
        signal.signal=="CALL"
        ?"lime":"red"
        }">

        ${signal.signal}

        </td>

        <td>

        ${signal.confidence}%

        </td>

        </tr>

        `;

    });

}