// ===== SIDEBAR =====

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

// ===== CLOSE MENU WITH ESC =====

document.addEventListener("keydown",function(e){

if(e.key==="Escape"){

document.getElementById("sidebar").style.left="-280px";
document.getElementById("overlay").style.display="none";

}

});

// ===== CARD ANIMATION =====

const cards=document.querySelectorAll(".card");

cards.forEach((card,index)=>{

card.style.opacity="0";
card.style.transform="translateY(40px)";

setTimeout(()=>{

card.style.transition=".5s";
card.style.opacity="1";
card.style.transform="translateY(0px)";

},index*120);

});

// ===== BUTTON EFFECT =====

document.querySelectorAll(".card button").forEach(btn=>{

btn.addEventListener("click",function(){

this.style.transform="scale(.95)";

setTimeout(()=>{

this.style.transform="scale(1)";

},150);

});

});