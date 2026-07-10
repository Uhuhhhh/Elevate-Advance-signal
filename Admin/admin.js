const loginPage = document.getElementById("loginPage");
const adminPage = document.getElementById("adminPage");
const pageContent = document.getElementById("pageContent");

const dashboardTab = document.getElementById("dashboardTab");
const addUserTab = document.getElementById("addUserTab");
const usersTab = document.getElementById("usersTab");
const settingsTab = document.getElementById("settingsTab");

const totalUsers = document.getElementById("totalUsers");
const premiumUsers = document.getElementById("premiumUsers");
const disabledUsers = document.getElementById("disabledUsers");
const expiredUsers = document.getElementById("expiredUsers");

let token = localStorage.getItem("adminToken");

if(token){

loginPage.style.display="none";
adminPage.style.display="block";

showDashboard();

}

// ---------------- LOGIN ----------------

document.getElementById("loginBtn").onclick = async()=>{

const password=document.getElementById("adminPassword").value;

if(!password){

document.getElementById("loginError").innerHTML="Enter Admin Password";

return;

}

try{

const response=await fetch("/api/admin-login",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({password})

});

const data=await response.json();

if(data.success){

localStorage.setItem("adminToken",data.token);

token=data.token;

loginPage.style.display="none";
adminPage.style.display="block";

showDashboard();

}else{

document.getElementById("loginError").innerHTML=data.message;

}

}catch{

document.getElementById("loginError").innerHTML="Server Error";

}

};

// ---------------- DASHBOARD ----------------

async function loadDashboard(){

try{

const response=await fetch("/api/get-users",{

headers:{
Authorization:"Bearer "+token
}

});

const users=await response.json();

totalUsers.innerHTML=users.length;

premiumUsers.innerHTML=
users.filter(x=>x.premium).length;

disabledUsers.innerHTML=
users.filter(x=>!x.enabled).length;

expiredUsers.innerHTML=
users.filter(x=>x.expired).length;

}catch(e){

console.log(e);

}

}

function showDashboard(){

clearTabs();

dashboardTab.classList.add("active");

document.getElementById("dashboardSection").style.display="block";

pageContent.innerHTML="";

loadDashboard();

}

// ---------------- ADD USER ----------------

function showAddUser(){

clearTabs();

addUserTab.classList.add("active");

document.getElementById("dashboardSection").style.display="none";

pageContent.innerHTML=`

<h2>Create User</h2>

<input
class="input"
id="userPassword"
placeholder="Password">

<input
class="input"
id="userDevice"
placeholder="Device ID">

<label style="display:block;margin-top:15px;">
<input type="checkbox" id="premium" checked>
 Premium User
</label>

<label style="display:block;margin-top:10px;">
<input type="checkbox" id="enabled" checked>
 Enabled
</label>

<label style="display:block;margin-top:15px;">
Expiry Date
</label>

<input
type="date"
class="input"
id="expiry">

<button
class="goldBtn"
id="createBtn">

Create User

</button>

<p id="msg"></p>

`;

document.getElementById("createBtn").onclick=createUser;

}

async function createUser(){

const password=document.getElementById("userPassword").value;

const deviceId=document.getElementById("userDevice").value;

const premium=document.getElementById("premium").checked;

const enabled=document.getElementById("enabled").checked;

const expiry=document.getElementById("expiry").value;

const response=await fetch("/api/create-user",{

method:"POST",

headers:{
"Content-Type":"application/json",
Authorization:"Bearer "+token
},

body:JSON.stringify({

password,
deviceId,
premium,
enabled,
expiry

})

});

const data=await response.json();

document.getElementById("msg").innerHTML=data.message;

}

// ---------------- USERS ----------------

async function showUsers(){

clearTabs();

usersTab.classList.add("active");

document.getElementById("dashboardSection").style.display="none";

pageContent.innerHTML=`

<h2>Users</h2>

<div id="userList">

Loading...

</div>

`;

const response=await fetch("/api/get-users",{

headers:{
Authorization:"Bearer "+token
}

});

const users=await response.json();

let html="";

users.forEach(user=>{

html+=`

<div class="userCard">

<h3>${user.deviceId}</h3>

<p><b>Premium:</b> ${user.premium?"✅ Yes":"❌ No"}</p>

<p><b>Status:</b> ${user.enabled?"🟢 Enabled":"🔴 Disabled"}</p>

<p><b>Expiry:</b> ${user.expiry || "Never"}</p>

<div class="userActions">

<button onclick="editUser('${user.id}')">

✏ Edit

</button>

<button onclick="deleteUser('${user.id}')">

🗑 Delete

</button>

</div>

</div>

`;

});

document.getElementById("userList").innerHTML=html;

}

async function editUser(id){

const response=await fetch("/api/get-users",{

headers:{
Authorization:"Bearer "+token
}

});

const users=await response.json();

const user=users.find(x=>x.id===id);

pageContent.innerHTML=`

<h2>Edit User</h2>

<input
class="input"
id="editPassword"
placeholder="New Password (Leave blank to keep same)">

<input
class="input"
id="editDevice"
value="${user.deviceId}">

<label style="display:block;margin-top:15px;">

<input
type="checkbox"
id="editPremium"
${user.premium?"checked":""}>

 Premium User

</label>

<label style="display:block;margin-top:10px;">

<input
type="checkbox"
id="editEnabled"
${user.enabled?"checked":""}>

 Enabled

</label>

<label style="display:block;margin-top:15px;">

Expiry Date

</label>

<input
type="date"
class="input"
id="editExpiry"
value="${user.expiry || ""}">

<button
class="goldBtn"
id="saveUser">

Save Changes

</button>

`;

document.getElementById("saveUser").onclick=()=>saveUser(id);

}

async function saveUser(id){

const password=document.getElementById("editPassword").value;

const deviceId=document.getElementById("editDevice").value;

const premium=document.getElementById("editPremium").checked;

const enabled=document.getElementById("editEnabled").checked;

const expiry=document.getElementById("editExpiry").value;

const response=await fetch("/api/update-user",{

method:"POST",

headers:{

"Content-Type":"application/json",

Authorization:"Bearer "+token

},

body:JSON.stringify({

id,
password,
deviceId,
premium,
enabled,
expiry

})

});

const data=await response.json();

alert(data.message);

showUsers();

}

// ---------------- DELETE ----------------

async function deleteUser(id){

if(!confirm("Delete User?")) return;

await fetch("/api/delete-user",{

method:"POST",

headers:{

"Content-Type":"application/json",

Authorization:"Bearer "+token

},

body:JSON.stringify({id})

});

showUsers();

loadDashboard();

}

// ---------------- SETTINGS ----------------

function showSettings(){

clearTabs();

settingsTab.classList.add("active");

document.getElementById("dashboardSection").style.display="none";

pageContent.innerHTML=`

<div class="userCard">

<h3>Settings</h3>

<button class="goldBtn" id="logoutBtn">

Logout

</button>

</div>

`;

document.getElementById("logoutBtn").onclick=()=>{

localStorage.removeItem("adminToken");

location.reload();

};

}

// ---------------- NAV ----------------

function clearTabs(){

dashboardTab.classList.remove("active");
addUserTab.classList.remove("active");
usersTab.classList.remove("active");
settingsTab.classList.remove("active");

}

dashboardTab.onclick=showDashboard;
addUserTab.onclick=showAddUser;
usersTab.onclick=showUsers;
settingsTab.onclick=showSettings;

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