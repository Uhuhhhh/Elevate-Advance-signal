// ========================================
// ELEVATE SIGNAL HISTORY
// ========================================

const history =
JSON.parse(localStorage.getItem("signalHistory")) || [];

// ---------- DOM ----------

const totalSignals =
document.getElementById("totalSignals");

const callSignals =
document.getElementById("callSignals");

const putSignals =
document.getElementById("putSignals");

const winSignals =
document.getElementById("winSignals");

const lossSignals =
document.getElementById("lossSignals");

const totalWins =
document.getElementById("totalWins");

const winRate =
document.getElementById("winRate");

const todayDate =
document.getElementById("todayDate");

// ---------- DATE ----------

const now = new Date();

todayDate.textContent =
now.toLocaleDateString("en-IN",{

weekday:"long",

day:"numeric",

month:"long",

year:"numeric"

});

// ---------- STATS ----------

function updateStats(){

let total = history.length;

let call = 0;
let put = 0;

let win = 0;
let loss = 0;

let confidence = 0;

history.forEach(item=>{

confidence += Number(item.confidence)||0;

if(item.signal==="CALL"){

call++;

}

if(item.signal==="PUT"){

put++;

}

if(item.result==="WIN"){

win++;

}

if(item.result==="LOSS"){

loss++;

}

});

totalSignals.textContent = total;

callSignals.textContent = call;

putSignals.textContent = put;

winSignals.textContent = win;

lossSignals.textContent = loss;

totalWins.textContent = win;

const rate =
total===0
?0
:((win/total)*100).toFixed(1);

winRate.textContent = rate+"%";

}

updateStats();

// ---------- CLOCK ----------

const clock =
document.getElementById("clock");

function updateClock(){

clock.textContent =
new Date().toLocaleTimeString("en-IN",{

hour:"2-digit",

minute:"2-digit",

second:"2-digit",

hour12:false

});

}

updateClock();

setInterval(updateClock,1000);

// ---------- SIDEBAR ----------

const sidebar =
document.getElementById("sidebar");

const overlay =
document.getElementById("overlay");

const menuBtn =
document.getElementById("menuBtn");

menuBtn.onclick=()=>{

sidebar.classList.add("show");

overlay.classList.add("show");

};

overlay.onclick=()=>{

sidebar.classList.remove("show");

overlay.classList.remove("show");

};

document.addEventListener("keydown",e=>{

if(e.key==="Escape"){

sidebar.classList.remove("show");

overlay.classList.remove("show");

}

});

// ---------- LOADER ----------

window.addEventListener("load",()=>{

setTimeout(()=>{

document
.getElementById("loader")
.classList.add("hide");

},700);

});

// ========================================
// HISTORY RENDER
// ========================================

const todayHistory =
document.getElementById("todayHistory");

const yesterdayHistory =
document.getElementById("yesterdayHistory");

const olderHistory =
document.getElementById("olderHistory");

const emptyState =
document.getElementById("emptyState");

const todayCount =
document.getElementById("todayCount");

const yesterdayCount =
document.getElementById("yesterdayCount");

const olderCount =
document.getElementById("olderCount");

const searchBox =
document.getElementById("searchBox");

const filterSignal =
document.getElementById("filterSignal");

let currentFilter="ALL";

// ---------- DATE HELPERS ----------

function isToday(time){

const d=new Date(time);

const n=new Date();

return d.getDate()==n.getDate() &&
d.getMonth()==n.getMonth() &&
d.getFullYear()==n.getFullYear();

}

function isYesterday(time){

const d=new Date(time);

const y=new Date();

y.setDate(y.getDate()-1);

return d.getDate()==y.getDate() &&
d.getMonth()==y.getMonth() &&
d.getFullYear()==y.getFullYear();

}

function getPairIcon(pair){

pair=(pair||"").toUpperCase();

switch(pair){

case "AUDCAD": return "🇦🇺🇨🇦";
case "AUDCHF": return "🇦🇺🇨🇭";
case "AUDJPY": return "🇦🇺🇯🇵";
case "AUDUSD": return "🇦🇺🇺🇸";

case "CADCHF": return "🇨🇦🇨🇭";
case "CADJPY": return "🇨🇦🇯🇵";

case "CHFJPY": return "🇨🇭🇯🇵";

case "EURAUD": return "🇪🇺🇦🇺";
case "EURCAD": return "🇪🇺🇨🇦";
case "EURCHF": return "🇪🇺🇨🇭";
case "EURGBP": return "🇪🇺🇬🇧";
case "EURJPY": return "🇪🇺🇯🇵";
case "EURUSD": return "🇪🇺🇺🇸";

case "GBPAUD": return "🇬🇧🇦🇺";
case "GBPCAD": return "🇬🇧🇨🇦";
case "GBPCHF": return "🇬🇧🇨🇭";
case "GBPJPY": return "🇬🇧🇯🇵";
case "GBPUSD": return "🇬🇧🇺🇸";

case "USDCAD": return "🇺🇸🇨🇦";
case "USDCHF": return "🇺🇸🇨🇭";
case "USDJPY": return "🇺🇸🇯🇵";

default:
return "💹";

}

}


// ---------- CARD ----------

function createCard(item){

const result=item.result||"Pending";

const resultClass=
result==="WIN"?"win":
result==="LOSS"?"loss":"pending";

const signalClass=
item.signal==="CALL"?"callBadge":"putBadge";

return `

<div class="historyCard">

<div class="left">

<div class="pairIcon">
${getPairIcon(item.pair)}
</div>

<div>

<h3>${item.pair}</h3>

<p>

${new Date(item.time).toLocaleTimeString([],{

hour:"2-digit",

minute:"2-digit"

})}

</p>

</div>

</div>

<div class="middle">

<div class="signalBadge ${signalClass}">
${item.signal}
</div>

<div class="confidence">

<div>

Confidence

<span>

${item.confidence}%

</span>

</div>

<div class="confidenceBar">

<div
class="confidenceFill"
style="width:${item.confidence}%">

</div>

</div>

</div>

</div>

<div class="right">

<div>

<label>Entry</label>

<h4>${item.entry}</h4>

</div>

<div>

<label>Expiry</label>

<h4>${item.expiry}</h4>

</div>

<div class="resultBadge ${resultClass}">

${result}

</div>

</div>

</div>

`;

}

// ---------- RENDER ----------

function renderHistory(list){

todayHistory.innerHTML="";
yesterdayHistory.innerHTML="";
olderHistory.innerHTML="";

let today=0;
let yesterday=0;
let older=0;

if(!list.length){

emptyState.style.display="block";

todayCount.textContent="0 Signals";
yesterdayCount.textContent="0 Signals";
olderCount.textContent="0 Signals";

return;

}

emptyState.style.display="none";

list.forEach(item=>{

const html=createCard(item);

if(isToday(item.time)){

today++;

todayHistory.innerHTML+=html;

}

else if(isYesterday(item.time)){

yesterday++;

yesterdayHistory.innerHTML+=html;

}

else{

older++;

olderHistory.innerHTML+=html;

}

});

todayCount.textContent=
today+" Signals";

yesterdayCount.textContent=
yesterday+" Signals";

olderCount.textContent=
older+" Signals";

}

renderHistory(history);

// ========================================
// SEARCH
// ========================================

function applyFilters(){

const query=
searchBox.value
.trim()
.toUpperCase();

const filtered=
history.filter(item=>{

const pair=
(item.pair||"")
.toUpperCase();

const pairMatch=
pair.includes(query);

let signalMatch=true;

if(currentFilter==="CALL"){

signalMatch=item.signal==="CALL";

}

else if(currentFilter==="PUT"){

signalMatch=item.signal==="PUT";

}

else if(currentFilter==="WIN"){

signalMatch=item.result==="WIN";

}

else if(currentFilter==="LOSS"){

signalMatch=item.result==="LOSS";

}

return pairMatch && signalMatch;

});

renderHistory(filtered);

}

searchBox.oninput=applyFilters;

filterSignal.onchange=()=>{

currentFilter=filterSignal.value;

applyFilters();

};

// ---------- FILTER CHIPS ----------

document.querySelectorAll(".chip")

.forEach(chip=>{

chip.onclick=()=>{

document.querySelectorAll(".chip")

.forEach(c=>c.classList.remove("active"));

chip.classList.add("active");

currentFilter=
chip.dataset.filter;

filterSignal.value=currentFilter;

applyFilters();

};

});

// ========================================
// CLEAR HISTORY
// ========================================

function clearHistory(){

if(!confirm("Delete all signal history?")) return;

localStorage.removeItem("signalHistory");

history.length=0;

updateStats();

renderHistory([]);

showToast("History Cleared");

}

// ========================================
// EXPORT CSV
// ========================================

function exportCSV(){

if(history.length===0){

showToast("No history available");

return;

}

let csv="Date,Pair,Signal,Confidence,Entry,Expiry,Result\n";

history.forEach(item=>{

csv+=`"${item.time}","${item.pair}","${item.signal}","${item.confidence}%","${item.entry}","${item.expiry}","${item.result||"Pending"}"\n`;

});

const blob=new Blob([csv],{

type:"text/csv"

});

const a=document.createElement("a");

a.href=URL.createObjectURL(blob);

a.download="Signal_History.csv";

a.click();

URL.revokeObjectURL(a.href);

showToast("CSV Exported");

}

// ========================================
// TOAST
// ========================================

const toast=document.getElementById("toast");

function showToast(text){

toast.textContent=text;

toast.classList.add("show");

setTimeout(()=>{

toast.classList.remove("show");

},2500);

}

// ========================================
// AUTO REFRESH
// ========================================

window.addEventListener("storage",()=>{

const updated=

JSON.parse(

localStorage.getItem("signalHistory")

)||[];

history.length=0;

history.push(...updated);

updateStats();

applyFilters();

});

// ========================================
// CARD ANIMATION
// ========================================

const observer=new IntersectionObserver(entries=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.style.opacity="1";

entry.target.style.transform="translateY(0px)";

}

});

});

function observeCards(){

document

.querySelectorAll(".historyCard")

.forEach(card=>{

card.style.opacity="0";

card.style.transform="translateY(25px)";

card.style.transition=".4s";

observer.observe(card);

});

}

setTimeout(observeCards,300);

// ========================================
// AUTO SAVE HELPERS
// ========================================

function saveHistory(){

localStorage.setItem(

"signalHistory",

JSON.stringify(history)

);

updateStats();

applyFilters();

}

// ========================================
// AUTO WIN/LOSS COUNT
// ========================================

history.forEach(item=>{

if(!item.result){

item.result="Pending";

}

});

saveHistory();