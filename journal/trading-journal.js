document.getElementById("unlockBtn").addEventListener("click", async () => {

    const password =
    document.getElementById("passwordInput").value;

    const deviceId =
    localStorage.getItem("deviceId");

    try{

        const response = await fetch("/api/login",{

            method:"POST",

            headers:{

                "Content-Type":"application/json"

            },

            body:JSON.stringify({

                password,

                deviceId

            })

        });

        const data = await response.json();

        if(data.success){

            localStorage.setItem(
                "token",
                data.token
            );

            document.getElementById("lockScreen").style.display="none";

            document.getElementById("mainApp").style.display="block";

        }else{

            document.getElementById("errorMsg").innerHTML=

            data.message || "Login Failed";

        }

    }catch(err){

        document.getElementById("errorMsg").innerHTML=

        "Server Error";

    }

});


let pieChart=null;
let profitChart=null;
const STORAGE_KEY = "tradingJournal";

let currentMonth = new Date().getMonth();

let currentYear = new Date().getFullYear();

function getTrades(){

    return JSON.parse(
        localStorage.getItem(STORAGE_KEY)
    ) || [];

}

function saveTrade(){

    const result = document.getElementById("result").value;

let profit = Number(document.getElementById("profit").value);

if(result==="LOSS"){

    profit = -Math.abs(profit);

}else if(result==="WIN"){

    profit = Math.abs(profit);

}else{

    profit = 0;

}

const trade={

    id:Date.now(),

    date:document.getElementById("tradeDate").value,

    pair:document.getElementById("pair").value,

    signal:document.getElementById("signal").value,

    amount:Number(document.getElementById("amount").value),

    result:result,

    profit:profit,

    notes:document.getElementById("notes").value

};

    const trades=getTrades();

    trades.unshift(trade);

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(trades)

    );

    loadTrades();
    

    document.querySelector(".journalForm").reset();

}

function loadTrades(){

    const trades=getTrades();

    const month=document.getElementById("monthFilter").value;

    const list=document.getElementById("tradeList");
    
    const search=document
.getElementById("searchTrade")
.value
.toUpperCase();

    list.innerHTML="";
    
    let lastDate="";

    let wins=0;

    let totalProfit=0;

    let total=0;
    
    let streak=0;

let bestStreak=0;

let pairStats={};

let today=new Date().toISOString().slice(0,10);

let todayCount=0;

    trades.forEach((trade,index)=>{

        const tradeMonth=new Date(trade.date).getMonth();

        if(month!="all" && tradeMonth!=month){

            return;

        }
        
        if(

search &&

!trade.pair.includes(search)

){

return;

}

        total++;

        if(trade.result=="WIN") wins++;

        totalProfit+=trade.profit;
        
        if(trade.date===today){

todayCount++;

}

pairStats[trade.pair]=(pairStats[trade.pair]||0)+1;

if(trade.result==="WIN"){

streak++;

if(streak>bestStreak){

bestStreak=streak;

}

}else{

streak=0;

}

        if(lastDate!==trade.date){

lastDate=trade.date;

list.innerHTML+=`

<tr class="dateRow">

<td colspan="5">

📅 ${trade.date}

</td>

</tr>

`;

}

list.innerHTML+=`

<tr>

<td>${trade.pair}</td>

<td>${trade.signal}</td>

<td class="${trade.result.toLowerCase()}">

${trade.result==="WIN"?"🟢":
trade.result==="LOSS"?"🔴":"🟡"}

</td>

<td class="${trade.result.toLowerCase()}">

₹${trade.profit}

</td>

<td>

<button class="editBtn"

onclick="editTrade(${index})">

✏️

</button>

<button class="deleteBtn"

onclick="deleteTrade(${index})">

🗑️

</button>

</td>

</tr>

`;

    });

    document.getElementById("totalTrades").innerHTML=total;

    document.getElementById("winRate").innerHTML=

    total?

    ((wins/total)*100).toFixed(1)+"%"

    :"0%";

    document.getElementById("netProfit").innerHTML=

    "₹"+totalProfit;



let bestPair="--";

let max=0;

for(const pair in pairStats){

if(pairStats[pair]>max){

max=pairStats[pair];

bestPair=pair;

}

}

document.getElementById("todayTrades").innerHTML=todayCount;

document.getElementById("bestStreak").innerHTML=bestStreak;

document.getElementById("currentStreak").innerHTML=streak;

document.getElementById("bestPair").innerHTML=bestPair;

drawChart(trades);

drawCalendar();

}

function deleteTrade(index){

    let trades=getTrades();

    trades.splice(index,1);

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(trades)

    );

    loadTrades();

}

function editTrade(index){

const trades=getTrades();

const t=trades[index];

document.getElementById("tradeDate").value=t.date;

document.getElementById("pair").value=t.pair;

document.getElementById("signal").value=t.signal;

document.getElementById("amount").value=t.amount;

document.getElementById("result").value=t.result;

document.getElementById("profit").value=t.profit;

document.getElementById("notes").value=t.notes;

deleteTrade(index);

}

loadTrades();

function drawChart(trades){

const ctx=document.getElementById("profitChart");

if(!ctx) return;

const labels=[];

const values=[];

let running=0;

trades
.slice()
.reverse()
.forEach(trade=>{

running+=Number(trade.profit);

labels.push(trade.date);

values.push(running);

});

if(profitChart){

profitChart.destroy();

}

profitChart=new Chart(ctx,{

type:"line",

data:{

labels:labels,

datasets:[{

label:"Net Profit",

data:values,

borderWidth:3,

fill:false,

tension:.3

}]

},

options:{

responsive:true,

plugins:{

legend:{

display:false

}

}

}

});

}



function toggleMenu(){

const sidebar=document.getElementById("sidebar");

const overlay=document.getElementById("overlay");

if(sidebar.style.left==="0px"){

sidebar.style.left="-280px";

overlay.style.display="none";

}else{

sidebar.style.left="0px";

overlay.style.display="block";

}

}

function closePopup(){

document.getElementById("dayPopup").style.display="none";

}

function showDayPopup(date){

const trades=getTrades().filter(t=>t.date===date);

let wins=0;

let losses=0;

let draws=0;

let profit=0;

trades.forEach(t=>{

if(t.result==="WIN") wins++;

else if(t.result==="LOSS") losses++;

else draws++;

profit+=Number(t.profit);

});

document.getElementById("popupDate").innerHTML=

"📅 "+new Date(date).toLocaleDateString("en-GB",{

day:"2-digit",

month:"long",

year:"numeric"

});

document.getElementById("popupTrades").innerHTML=

trades.length;

document.getElementById("popupWins").innerHTML=

wins;

document.getElementById("popupLosses").innerHTML=

losses;

document.getElementById("popupDraws").innerHTML=

draws;

const title=document.getElementById("popupProfitTitle");

const amount=document.getElementById("popupProfit");

if(trades.length===0){

title.innerHTML="📭 No Trade";

amount.innerHTML="₹0";

amount.style.color="#888";

}else if(profit>=0){

title.innerHTML="💰 Net Profit";

amount.innerHTML="+₹"+profit;

amount.style.color="#00ff66";

}else{

title.innerHTML="💸 Net Loss";

amount.innerHTML="-₹"+Math.abs(profit);

amount.style.color="#ff4444";

}

document.getElementById("dayPopup").style.display="flex";

}

function drawCalendar(){

const grid=document.getElementById("calendarGrid");

const title=document.getElementById("calendarTitle");

if(!grid) return;

grid.innerHTML="";

const monthNames=[

"January","February","March","April",

"May","June","July","August",

"September","October","November","December"

];

title.innerHTML=monthNames[currentMonth]+" "+currentYear;

const firstDay=new Date(currentYear,currentMonth,1).getDay();

const totalDays=new Date(currentYear,currentMonth+1,0).getDate();

for(let i=0;i<firstDay;i++){

grid.innerHTML+=`<div class="calendarDay empty"></div>`;

}

const trades=getTrades();

for(let day=1;day<=totalDays;day++){

const date=

`${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

const dayTrades=

trades.filter(t=>t.date===date);

let profit=0;

dayTrades.forEach(t=>{

profit+=Number(t.profit);

});

let cls="gray";

if(dayTrades.length){

cls=profit>=0?"green":"red";

}

grid.innerHTML+=`

<div

class="calendarDay ${cls}"

onclick="showDayPopup('${date}')">

${day}

</div>

`;

}

}

function changeMonth(step){

currentMonth+=step;

if(currentMonth<0){

currentMonth=11;

currentYear--;

}

if(currentMonth>11){

currentMonth=0;

currentYear++;

}

drawCalendar();

}