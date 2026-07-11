// ========================================
// MONEY MANAGEMENT
// ========================================

const balanceInput=document.getElementById("balance");

const payout=document.getElementById("payout");

const riskInput=document.getElementById("risk");

const generate=document.getElementById("generate");

const riskButtons=document.querySelectorAll(".riskBtn");

// ========================================
// RISK BUTTON
// ========================================

riskButtons.forEach(btn=>{

btn.onclick=()=>{

riskButtons.forEach(b=>b.classList.remove("active"));

btn.classList.add("active");

riskInput.value=btn.dataset.risk;

localStorage.setItem("risk",btn.dataset.risk);

};

});

const savedRisk=localStorage.getItem("risk");

if(savedRisk){

riskInput.value=savedRisk;

riskButtons.forEach(btn=>{

btn.classList.toggle("active",btn.dataset.risk===savedRisk);

});

}

// ========================================
// GENERATE
// ========================================

generate.onclick=generatePlan;

function generatePlan(){

const balance=parseFloat(balanceInput.value);

if(isNaN(balance)||balance<=0){

alert("Enter a valid balance");

return;

}

const risk=parseFloat(riskInput.value);

const payoutPercent=parseFloat(payout.value)/100;

// ----------------------------------------

const base=(balance*risk)/100;

let step1=base;

let step2=(step1/payoutPercent)+step1;

let step3=(step2/payoutPercent)+step2;

let step4=(step3/payoutPercent)+step3;

let step5=(step4/payoutPercent)+step4;

// ----------------------------------------

document.getElementById("step1").textContent="$"+step1.toFixed(2);

document.getElementById("step2").textContent="$"+step2.toFixed(2);

document.getElementById("step3").textContent="$"+step3.toFixed(2);

document.getElementById("step4").textContent="$"+step4.toFixed(2);

document.getElementById("step5").textContent="$"+step5.toFixed(2);

// ----------------------------------------

const totalRisk=

step1+

step2+

step3+

step4+

step5;

const target=balance*0.05;

const stop=balance*0.03;

const remain=balance-totalRisk;

document.getElementById("target").textContent=

"$"+target.toFixed(2);

document.getElementById("stop").textContent=

"$"+stop.toFixed(2);

document.getElementById("riskAmount").textContent=

"$"+totalRisk.toFixed(2);

document.getElementById("remaining").textContent=

"$"+remain.toFixed(2);

// ----------------------------------------

updateRiskBar(totalRisk,balance);

// ----------------------------------------

localStorage.setItem("balance",balance);

localStorage.setItem("payout",payout.value);

}

// ========================================
// LOAD LAST SETTINGS
// ========================================

if(localStorage.getItem("balance"))

balanceInput.value=

localStorage.getItem("balance");

if(localStorage.getItem("payout"))

payout.value=

localStorage.getItem("payout");

// ========================================
// RISK BAR
// ========================================

function updateRiskBar(totalRisk,balance){

const percent=

Math.min(

(totalRisk/balance)*100,

100

);

const fill=

document.getElementById("progressFill");

fill.style.width=

percent+"%";

document.getElementById("riskPercent").textContent=

percent.toFixed(1)+"%";

document.getElementById("progressText").textContent=

percent.toFixed(1)+"%";

document.getElementById("riskText").textContent=

"$"+totalRisk.toFixed(2)+

" / $"+balance.toFixed(2);

const level=

document.getElementById("riskLevel");

const status=

document.getElementById("riskStatus");

if(percent<=10){

fill.style.background=

"linear-gradient(90deg,#00E676,#4CAF50)";

level.textContent="LOW";

level.style.color="#00E676";

status.textContent="LOW RISK";

}

else if(percent<=25){

fill.style.background=

"linear-gradient(90deg,#FFC107,#FF9800)";

level.textContent="MEDIUM";

level.style.color="#FFC107";

status.textContent="MEDIUM RISK";

}

else{

fill.style.background=

"linear-gradient(90deg,#FF5252,#D50000)";

level.textContent="HIGH";

level.style.color="#FF5252";

status.textContent="HIGH RISK";

}

}

// ========================================
// AUTO GENERATE
// ========================================

balanceInput.addEventListener("keyup",()=>{

if(balanceInput.value)

generatePlan();

});

payout.addEventListener("change",()=>{

if(balanceInput.value)

generatePlan();

});

riskButtons.forEach(btn=>{

btn.addEventListener("click",()=>{

if(balanceInput.value)

generatePlan();

});

});

// ========================================
// RESET
// ========================================

function resetPlanner(){

balanceInput.value="";

document.querySelectorAll(

"#step1,#step2,#step3,#step4,#step5"

).forEach(el=>el.textContent="-");

document.getElementById("target").textContent="-";
document.getElementById("stop").textContent="-";
document.getElementById("riskAmount").textContent="-";
document.getElementById("remaining").textContent="-";

updateRiskBar(0,1);

}

// ========================================
// EXPORT CSV
// ========================================

function exportPlan(){

const rows=[

["Step","Trade"],

["1",document.getElementById("step1").textContent],

["2",document.getElementById("step2").textContent],

["3",document.getElementById("step3").textContent],

["4",document.getElementById("step4").textContent],

["5",document.getElementById("step5").textContent]

];

let csv=rows.map(r=>r.join(",")).join("\n");

const blob=new Blob([csv],{

type:"text/csv"

});

const a=document.createElement("a");

a.href=URL.createObjectURL(blob);

a.download="Money_Management.csv";

a.click();

URL.revokeObjectURL(a.href);

}

// ========================================
// PRINT
// ========================================

function printPlan(){

window.print();

}

// ========================================
// AUTO LOAD
// ========================================

window.onload=()=>{

if(balanceInput.value){

generatePlan();

}else{

updateRiskBar(0,1);

}

};