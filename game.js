
const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");

const WIDTH=canvas.width;
const HEIGHT=canvas.height;

let cameraX=0;

const player={
x:100,
y:450,
w:50,
h:90,
vy:0,
onGround:false
};

const gravity=0.7;

const platforms=[
{x:0,y:540,w:2000,h:60},

{x:350,y:450,w:150,h:20},
{x:600,y:380,w:150,h:20},
{x:900,y:320,w:150,h:20},
{x:1200,y:380,w:150,h:20},
{x:1500,y:300,w:150,h:20},
{x:1750,y:240,w:150,h:20}
];

const candles=[
{x:380,y:410,digit:"4",collected:false},
{x:930,y:280,digit:"2",collected:false},
{x:1780,y:200,digit:"1",collected:false}
];

const dogs=[
{x:700,y:510,w:60,h:35,dir:1,color:"brown"},
{x:1350,y:510,w:60,h:35,dir:-1,color:"white"}
];

let digits=[];

const goal={x:1950,y:420,w:60,h:120};

let won=false;

let confetti=[];

const keys={};

document.addEventListener("keydown",e=>keys[e.key]=true);
document.addEventListener("keyup",e=>keys[e.key]=false);

document.getElementById("leftBtn").ontouchstart=()=>keys["ArrowLeft"]=true;
document.getElementById("rightBtn").ontouchstart=()=>keys["ArrowRight"]=true;
document.getElementById("jumpBtn").ontouchstart=()=>keys[" "]=true;

document.getElementById("leftBtn").ontouchend=()=>keys["ArrowLeft"]=false;
document.getElementById("rightBtn").ontouchend=()=>keys["ArrowRight"]=false;
document.getElementById("jumpBtn").ontouchend=()=>keys[" "]=false;

function playBirthday(){

const audioCtx=new (window.AudioContext||window.webkitAudioContext)();

const melody=[
392,392,440,392,523,494,
392,392,440,392,587,523
];

let t=0;

melody.forEach(n=>{

const osc=audioCtx.createOscillator();
const gain=audioCtx.createGain();

osc.frequency.value=n;
osc.type="triangle";

osc.connect(gain);
gain.connect(audioCtx.destination);

gain.gain.value=0.1;

osc.start(audioCtx.currentTime+t);
osc.stop(audioCtx.currentTime+t+0.3);

t+=0.35;

});

}

function drawPlayer(){

const x=player.x-cameraX;

ctx.lineWidth=3;
ctx.strokeStyle="black";

ctx.fillStyle="#ffe0bd";
ctx.beginPath();
ctx.arc(x+25,player.y+20,15,0,Math.PI*2);
ctx.fill();
ctx.stroke();

ctx.fillStyle="#f6d14b";
ctx.beginPath();
ctx.arc(x+25,player.y+10,17,Math.PI,0);
ctx.fill();

ctx.fillStyle="#ff6ea8";
ctx.fillRect(x+10,player.y+35,30,30);
ctx.strokeRect(x+10,player.y+35,30,30);

ctx.fillStyle="#333";
ctx.fillRect(x+12,player.y+65,10,25);
ctx.fillRect(x+28,player.y+65,10,25);

}

function drawPlatforms(){

platforms.forEach(p=>{

ctx.fillStyle="#fff";
ctx.strokeStyle="#333";
ctx.lineWidth=4;

ctx.fillRect(p.x-cameraX,p.y,p.w,p.h);
ctx.strokeRect(p.x-cameraX,p.y,p.w,p.h);

});

}

function drawCandles(){

candles.forEach(c=>{

if(!c.collected){

const x=c.x-cameraX;

ctx.fillStyle="pink";
ctx.fillRect(x,c.y,18,30);

ctx.fillStyle="orange";
ctx.beginPath();
ctx.arc(x+9,c.y-4,6,0,Math.PI*2);
ctx.fill();

}

});

}

function drawDogs(){

dogs.forEach(d=>{

const x=d.x-cameraX;

ctx.fillStyle=d.color==="brown"?"#9c5a2a":"#ffffff";

ctx.strokeStyle="black";
ctx.lineWidth=3;

ctx.fillRect(x,d.y,d.w,d.h);
ctx.strokeRect(x,d.y,d.w,d.h);

ctx.beginPath();
ctx.arc(x+15,d.y+12,3,0,Math.PI*2);
ctx.fillStyle="black";
ctx.fill();

});

}

function drawGoal(){

const x=goal.x-cameraX;

ctx.strokeStyle="black";
ctx.lineWidth=4;

ctx.fillStyle="green";
ctx.fillRect(x+20,goal.y+20,20,90);
ctx.strokeRect(x+20,goal.y+20,20,90);

ctx.fillStyle="gold";
ctx.fillRect(x+15,goal.y,30,25);
ctx.strokeRect(x+15,goal.y,30,25);

ctx.fillStyle="white";
ctx.font="16px Comic Sans MS";
ctx.fillText("SEKT",x+10,goal.y+80);

}

function updateDogs(){

dogs.forEach(d=>{

d.x+=d.dir*2;

if(d.x>1500||d.x<650)d.dir*=-1;

if(
player.x<d.x+d.w &&
player.x+player.w>d.x &&
player.y<d.y+d.h &&
player.y+player.h>d.y
){

player.x=100;
player.y=450;

}

});

}

function updatePlayer(){

if(keys["ArrowRight"])player.x+=5;
if(keys["ArrowLeft"])player.x-=5;

if(keys[" "]&&player.onGround){

player.vy=-14;
player.onGround=false;

}

player.vy+=gravity;
player.y+=player.vy;

platforms.forEach(p=>{

if(
player.x<p.x+p.w &&
player.x+player.w>p.x &&
player.y+player.h>p.y &&
player.y+player.h<p.y+25 &&
player.vy>=0
){

player.y=p.y-player.h;
player.vy=0;
player.onGround=true;

}

});

candles.forEach(c=>{

if(!c.collected &&
player.x<c.x+18 &&
player.x+player.w>c.x &&
player.y<c.y+30 &&
player.y+player.h>c.y
){

c.collected=true;
digits.push(c.digit);

}

});

if(
player.x<goal.x+goal.w &&
player.x+player.w>goal.x &&
player.y<goal.y+goal.h &&
player.y+player.h>goal.y &&
digits.length===3
){

won=true;
playBirthday();

for(let i=0;i<150;i++){

confetti.push({
x:goal.x,
y:goal.y,
vx:(Math.random()-0.5)*8,
vy:-Math.random()*8
});

}

}

cameraX=player.x-300;

}

function drawConfetti(){

confetti.forEach(c=>{

c.x+=c.vx;
c.y+=c.vy;
c.vy+=0.3;

ctx.fillStyle="red";
ctx.fillRect(c.x-cameraX,c.y,5,5);

});

}

function drawUI(){

ctx.fillStyle="black";
ctx.font="22px Comic Sans MS";
ctx.fillText("Kerzen: "+digits.length+"/3",20,40);

if(won){

ctx.font="46px Comic Sans MS";
ctx.fillText("Code: "+digits.join(" "),550,200);

}

}

function loop(){

ctx.clearRect(0,0,WIDTH,HEIGHT);

drawPlatforms();
drawCandles();
drawDogs();
drawGoal();

updateDogs();
updatePlayer();

drawPlayer();

if(won)drawConfetti();

drawUI();

requestAnimationFrame(loop);

}

loop();
