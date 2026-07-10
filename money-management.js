document.querySelectorAll(".riskBtn").forEach(btn=>{

btn.onclick=function(){

const remaining=

balance-totalRisk;
const percent=

(totalRisk/balance)*100;

document.getElementById("progressFill").style.width=

percent+"%";

document.getElementById("progressText").innerHTML=

percent.toFixed(1)+"% of Balance Used";

document.querySelectorAll(".riskBtn")

.forEach(b=>b.classList.remove("active"));

this.classList.add("active");

document.getElementById("risk").value=

this.dataset.risk;

};

});
const btn = document.getElementById("generate");

btn.onclick = function () {

const balance = Number(document.getElementById("balance").value);

const riskPercent = Number(document.getElementById("risk").value);

const payout = Number(document.getElementById("payout").value) / 100;

if(balance <= 0){

alert("Enter a valid balance");

return;

}

// Starting Trade

const profitTarget = balance * (riskPercent / 100);

let steps = [];

let previousLoss = 0;

for(let i=0;i<5;i++){

let trade = (previousLoss + profitTarget) / payout;

trade = Math.ceil(trade);

steps.push(trade);

previousLoss += trade;

}

// Show Steps

document.getElementById("step1").innerHTML = "₹" + steps[0];

document.getElementById("step2").innerHTML = "₹" + steps[1];

document.getElementById("step3").innerHTML = "₹" + steps[2];

document.getElementById("step4").innerHTML = "₹" + steps[3];

document.getElementById("step5").innerHTML = "₹" + steps[4];

// Total Risk

let totalRisk = 0;

steps.forEach(function(x){

totalRisk += x;

});

// Summary

const dailyTarget = balance * 0.05;

const stopLoss = balance * 0.03;

const remaining = balance - totalRisk;

document.getElementById("target").innerHTML =
"₹" + dailyTarget.toFixed(2);

document.getElementById("stop").innerHTML =
"₹" + stopLoss.toFixed(2);

document.getElementById("riskAmount").innerHTML =
"₹" + totalRisk.toFixed(2);

document.getElementById("remaining").innerHTML =
"₹" + remaining.toFixed(2);

};