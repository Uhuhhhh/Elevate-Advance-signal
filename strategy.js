// ======================================
// ELEVATE STRATEGY HUB
// ======================================

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const menuBtn = document.getElementById("menuBtn");
const clock = document.getElementById("clock");

// =========================
// Sidebar
// =========================

function openSidebar(){

    sidebar.classList.add("show");
    overlay.classList.add("show");

}

function closeSidebar(){

    sidebar.classList.remove("show");
    overlay.classList.remove("show");

}

if(menuBtn){

    menuBtn.onclick = openSidebar;

}

if(overlay){

    overlay.onclick = closeSidebar;

}

document.addEventListener("keydown",e=>{

    if(e.key==="Escape"){

        closeSidebar();

    }

});

// =========================
// Live Clock
// =========================

function updateClock(){

    const now = new Date();

    clock.textContent = now.toLocaleTimeString("en-IN",{

        hour:"2-digit",
        minute:"2-digit",
        second:"2-digit",
        hour12:false,
        timeZone:"Asia/Kolkata"

    });

}

updateClock();

setInterval(updateClock,1000);

// =========================
// Card Animation
// =========================

const observer = new IntersectionObserver(entries=>{

    entries.forEach(entry=>{

        if(entry.isIntersecting){

            entry.target.classList.add("showCard");

        }

    });

},{
    threshold:.15
});

document.querySelectorAll(

".strategyCard,.tipCard,.performanceCard,.recommendCard,.hero"

).forEach(card=>{

    observer.observe(card);

});

// =========================
// Ripple Effect
// =========================

document.querySelectorAll("button").forEach(btn=>{

    btn.addEventListener("click",function(e){

        const ripple = document.createElement("span");

        const size = Math.max(

            this.clientWidth,
            this.clientHeight

        );

        ripple.style.width=size+"px";
        ripple.style.height=size+"px";

        ripple.style.left=
        e.offsetX-size/2+"px";

        ripple.style.top=
        e.offsetY-size/2+"px";

        ripple.className="ripple";

        this.appendChild(ripple);

        setTimeout(()=>{

            ripple.remove();

        },600);

    });

});

// =========================
// Floating Hero Icon
// =========================

const heroIcon=document.querySelector(".heroIcon");

if(heroIcon){

let up=true;

setInterval(()=>{

heroIcon.style.transform=

up?

"translateY(-6px)"

:

"translateY(0px)";

up=!up;

},900);

}

// =========================
// Glow on Hover
// =========================

document.querySelectorAll(".strategyCard").forEach(card=>{

card.addEventListener("mouseenter",()=>{

card.style.boxShadow=

"0 25px 60px rgba(124,77,255,.45)";

});

card.addEventListener("mouseleave",()=>{

card.style.boxShadow="";

});

});

// =========================
// Recommendation Pulse
// =========================

const recommend=document.querySelector(".recommendIcon");

if(recommend){

setInterval(()=>{

recommend.animate([

{

transform:"scale(1)"

},

{

transform:"scale(1.08)"

},

{

transform:"scale(1)"

}

],{

duration:1200

});

},2500);

}

// =========================
// Button Hover
// =========================

document.querySelectorAll(

".strategyCard button,.openStrategyBtn"

).forEach(btn=>{

btn.addEventListener("mouseenter",()=>{

btn.style.transform="translateY(-3px) scale(1.02)";

});

btn.addEventListener("mouseleave",()=>{

btn.style.transform="";

});

});

// =========================
// Progress Animation
// =========================

window.addEventListener("load",()=>{

document.querySelectorAll(".progressFill")

.forEach(bar=>{

const width=bar.style.width;

bar.style.width="0";

setTimeout(()=>{

bar.style.width=width;

},300);

});

});

// =========================
// Sidebar Active
// =========================

document.querySelectorAll(".sideBtn")

.forEach(btn=>{

btn.addEventListener("click",()=>{

document.querySelectorAll(".sideBtn")

.forEach(x=>x.classList.remove("active"));

btn.classList.add("active");

});

});