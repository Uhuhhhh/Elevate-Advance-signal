// ===============================
// Elevate Trading AI Signal
// ===============================

const uploadBtn = document.getElementById("uploadBtn");
const uploadBox = document.getElementById("uploadBox");
const imageInput = document.getElementById("chartImage");
const previewImage = document.getElementById("previewImage");

const analyzeBtn = document.getElementById("analyzeBtn");

const loading = document.getElementById("loading");
const resultCard = document.getElementById("resultCard");

const signalText = document.getElementById("signalText");
const confidence = document.getElementById("confidence");
const trend = document.getElementById("trend");
const entry = document.getElementById("entry");
const expiry = document.getElementById("expiry");
const risk = document.getElementById("risk");
const reasonList = document.getElementById("reasonList");

let selectedImage = "";
let timeframe = "1M";

// ===============================
// Upload Button
// ===============================

uploadBtn.addEventListener("click", () => {

    imageInput.click();

});

uploadBox.addEventListener("click", () => {

    imageInput.click();

});

// ===============================
// Select Image
// ===============================

imageInput.addEventListener("change", () => {

    const file = imageInput.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {

        selectedImage = e.target.result;

        previewImage.src = selectedImage;

        previewImage.style.display = "block";
        
        imageInput.value = "";

        analyzeBtn.disabled = false;

    };

    reader.readAsDataURL(file);

});

// ===============================
// Timeframe
// ===============================

document.querySelectorAll(".tf").forEach(btn => {

    btn.addEventListener("click", () => {

        document.querySelectorAll(".tf").forEach(b => {

            b.classList.remove("active");

        });

        btn.classList.add("active");

        timeframe = btn.innerText;

    });

});

document.addEventListener("paste", (e) => {

    const items = e.clipboardData.items;

    for (const item of items) {

        if (item.type.startsWith("image/")) {

            const file = item.getAsFile();

            selectedImage = file;

            preview.hidden = false;
            preview.src = URL.createObjectURL(file);

            return;

        }

    }

});

// ===============================
// Analyze
// ===============================

analyzeBtn.addEventListener("click", analyzeChart);

async function analyzeChart() {

    if (!selectedImage) {

        alert("Please upload a chart.");

        return;

    }

    loading.style.display = "block";
    resultCard.style.display = "none";
    analyzeBtn.disabled = true;

    try {

        const response = await fetch("/api/analyze-chart", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                image: selectedImage,

                market: document.getElementById("market").value,

                timeframe: timeframe

            })

        });

        const data = await response.json();

        loading.style.display = "none";
        analyzeBtn.disabled = false;

        if (!response.ok) {

            alert(data.error || "Analysis failed");

            return;

        }

        displayResult(data);

    } catch (err) {

        loading.style.display = "none";
        analyzeBtn.disabled = false;

        console.error(err);

        alert("Server Error");

    }

}

// ===============================
// Display Result
// ===============================

function displayResult(data) {

    resultCard.style.display = "block";

    signalText.innerText = data.signal || "WAIT";

    confidence.innerText = (data.confidence || 0) + "%";

    trend.innerText = data.trend || "-";

    entry.innerText = data.entry || "-";

    expiry.innerText = data.expiry || "-";

    risk.innerText = data.risk || "-";

    reasonList.innerHTML = "";

    if (Array.isArray(data.reason)) {

        data.reason.forEach(item => {

            const li = document.createElement("li");

            li.textContent = item;

            reasonList.appendChild(li);

        });

    }

    signalText.className = "";

    if (data.signal === "CALL") {

        signalText.classList.add("result-call");

    } else if (data.signal === "PUT") {

        signalText.classList.add("result-put");

    } else {

        signalText.classList.add("result-wait");

    }

}

// ===============================
// Premium Check
// ===============================

checkPremium();

async function checkPremium(){

    try{

        const response=await fetch("/api/user");

        if(!response.ok) return;

        const user=await response.json();

        applyPremium(user);

    }catch(e){

        console.log(e);

    }

}

function applyPremium(user){

    const upgradeCard=document.getElementById("upgradeCard");

    const premiumAnalysis=document.getElementById("premiumAnalysis");

    const adminMenu=document.getElementById("adminMenu");

    if(user.admin){

        adminMenu.style.display="flex";

    }

    if(user.premium){

        upgradeCard.style.display="none";

        premiumAnalysis.innerHTML=`

<h2>👑 Premium AI</h2>

<div class="lock-item">

<span>Liquidity Sweep</span>

<span>✅</span>

</div>

<div class="lock-item">

<span>Smart Money</span>

<span>✅</span>

</div>

<div class="lock-item">

<span>Order Blocks</span>

<span>✅</span>

</div>

<div class="lock-item">

<span>Fair Value Gap</span>

<span>✅</span>

</div>

<div class="lock-item">

<span>Institutional Bias</span>

<span>✅</span>

</div>

<div class="lock-item">

<span>Expiry Optimization</span>

<span>✅</span>

</div>

`;

    }else{

        premiumAnalysis.style.opacity=".6";

    }

}

