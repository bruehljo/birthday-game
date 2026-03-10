const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const WORLD_WIDTH = 3600;
const FLOOR_Y = 610;

let audioCtx = null;
let musicStarted = false;

const state = {
  started: false,
  won: false,
  exploded: false,
  codeDigits: ["4", "2", "1"],
  collectedDigits: [],
  cameraX: 0,
  introLines: [
    "Liebe Virág!",
    "Wir wünschen Dir alles Liebe und Gute zum Geburtstag!",
    "Erst mit Hilfe dieses Spiels bekommst Du die Möglichkeit",
    "Dein Geburtstagsgeschenk zu öffnen.",
    "Wir wünschen Dir viel Spaß :)!"
  ]
};

const player = {
  x: 90,
  y: FLOOR_Y - 98,
  w: 54,
  h: 98,
  vx: 0,
  vy: 0,
  speed: 5.2,
  jumpPower: 15.6,
  onGround: false,
  facing: 1,
  step: 0
};

const controls = {
  left: false,
  right: false,
  jump: false
};

const gravity = 0.72;
const friction = 0.82;

const groundSegments = [
  {x: 0, w: 540},
  {x: 620, w: 520},
  {x: 1240, w: 420},
  {x: 1760, w: 500},
  {x: 2360, w: 520},
  {x: 3000, w: 600}
];

const platforms = [
  {x: 360, y: 520, w: 130, h: 20, kind: "platform"},
  {x: 560, y: 450, w: 120, h: 20, kind: "platform"},
  {x: 760, y: 380, w: 120, h: 20, kind: "platform"},
  {x: 980, y: 320, w: 140, h: 20, kind: "platform"},
  {x: 1310, y: 520, w: 130, h: 20, kind: "platform"},
  {x: 1510, y: 450, w: 120, h: 20, kind: "platform"},
  {x: 1720, y: 380, w: 140, h: 20, kind: "platform"},
  {x: 1980, y: 300, w: 150, h: 20, kind: "platform"},
  {x: 2300, y: 520, w: 120, h: 20, kind: "platform"},
  {x: 2470, y: 455, w: 110, h: 20, kind: "platform"},
  {x: 2660, y: 385, w: 125, h: 20, kind: "platform"},
  {x: 2860, y: 315, w: 150, h: 20, kind: "platform"},
  {x: 3170, y: 260, w: 130, h: 20, kind: "platform"}
];

const candles = [
  {x: 586, y: 404, w: 22, h: 40, collected: false, digit: state.codeDigits[0]},
  {x: 1748, y: 334, w: 22, h: 40, collected: false, digit: state.codeDigits[1]},
  {x: 3198, y: 214, w: 22, h: 40, collected: false, digit: state.codeDigits[2]}
];

const dogs = [
  {x: 860, y: FLOOR_Y - 36, w: 66, h: 36, minX: 760, maxX: 1070, speed: 1.7, dir: 1, color: "brown"},
  {x: 2570, y: FLOOR_Y - 38, w: 68, h: 38, minX: 2440, maxX: 2810, speed: 2.0, dir: -1, color: "white"}
];

const movingPlatforms = [
  {x: 2130, y: 430, w: 120, h: 18, baseY: 430, range: 58, speed: 0.02, t: 0},
  {x: 3010, y: 430, w: 120, h: 18, baseY: 430, range: 70, speed: 0.025, t: 1.2}
];

const treats = [
  {x: 430, y: 486, taken: false},
  {x: 1110, y: 286, taken: false},
  {x: 2080, y: 266, taken: false},
  {x: 2890, y: 281, taken: false}
];

const goal = {x: 3420, y: 430, w: 70, h: 150};
const champagneBurst = [];
const confetti = [];
let bonusTreats = 0;

const parallax = {
  clouds: [
    {x: 180, y: 100, s: 1.15},
    {x: 520, y: 140, s: 0.95},
    {x: 960, y: 110, s: 1.05},
    {x: 1380, y: 160, s: 1.2},
    {x: 1900, y: 100, s: 1.1},
    {x: 2600, y: 135, s: 0.95},
    {x: 3220, y: 120, s: 1.15}
  ],
  hills: [
    {x: 0, w: 520, h: 180, c1: "#b4e08f", c2: "#8bc36a"},
    {x: 400, w: 580, h: 210, c1: "#c1e89f", c2: "#93cd74"},
    {x: 930, w: 520, h: 190, c1: "#b5df89", c2: "#8cc86a"},
    {x: 1450, w: 560, h: 215, c1: "#c5eba7", c2: "#95cb74"},
    {x: 1990, w: 580, h: 180, c1: "#b5df89", c2: "#8cc86a"},
    {x: 2520, w: 520, h: 205, c1: "#c1e89f", c2: "#93cd74"},
    {x: 3000, w: 640, h: 195, c1: "#b4e08f", c2: "#8bc36a"}
  ]
};

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playNote(freq, start, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.05, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function startBirthdayLoop() {
  if (musicStarted) return;
  ensureAudio();
  musicStarted = true;
  const melody = [
    392,392,440,392,523,494,
    392,392,440,392,587,523,
    392,392,784,659,523,494,440,
    698,698,659,523,587,523
  ];
  const beat = 0.32;
  let nextAt = audioCtx.currentTime + 0.2;

  function scheduleBar() {
    melody.forEach((freq, i) => {
      playNote(freq, nextAt + i * beat, beat * 0.78);
    });
    nextAt += melody.length * beat + 0.4;
    setTimeout(scheduleBar, (melody.length * beat + 0.2) * 1000);
  }
  scheduleBar();
}

function resetPlayer() {
  player.x = 90;
  player.y = FLOOR_Y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
}

function startGame() {
  state.started = true;
  startBirthdayLoop();
}

function intersects(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

function triggerWin() {
  if (state.won) return;
  state.won = true;
  if (!state.exploded) {
    state.exploded = true;
    for (let i = 0; i < 34; i++) {
      champagneBurst.push({
        x: goal.x + 36,
        y: goal.y + 18,
        vx: 2 + Math.random() * 6,
        vy: -7 - Math.random() * 6,
        life: 70 + Math.random() * 30
      });
    }
    for (let i = 0; i < 180; i++) {
      confetti.push({
        x: goal.x + 36,
        y: goal.y + 20,
        vx: -5 + Math.random() * 10,
        vy: -7 + Math.random() * -3,
        size: 4 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vr: -0.25 + Math.random() * 0.5,
        color: ["#ff4f8b", "#ffd166", "#6dd3ff", "#7ee081", "#8a5cff", "#ffffff"][Math.floor(Math.random() * 6)]
      });
    }
  }
}

function updateMovingPlatforms() {
  movingPlatforms.forEach(p => {
    p.t += p.speed;
    p.y = p.baseY + Math.sin(p.t) * p.range;
  });
}

function allColliders() {
  const cols = [];
  groundSegments.forEach(g => cols.push({x: g.x, y: FLOOR_Y, w: g.w, h: HEIGHT - FLOOR_Y, kind: "ground"}));
  platforms.forEach(p => cols.push({x: p.x, y: p.y, w: p.w, h: p.h, kind: p.kind}));
  movingPlatforms.forEach(p => cols.push({x: p.x, y: p.y, w: p.w, h: p.h, kind: "moving"}));
  return cols;
}

function handleInput() {
  if (!state.started || state.won) return;

  if (controls.left) {
    player.vx = -player.speed;
    player.facing = -1;
  } else if (controls.right) {
    player.vx = player.speed;
    player.facing = 1;
  } else {
    player.vx *= friction;
    if (Math.abs(player.vx) < 0.08) player.vx = 0;
  }

  if (controls.jump && player.onGround) {
    player.vy = -player.jumpPower;
    player.onGround = false;
    controls.jump = false;
  }
}

function updateDogs() {
  dogs.forEach(dog => {
    dog.x += dog.speed * dog.dir;
    if (dog.x <= dog.minX || dog.x + dog.w >= dog.maxX) dog.dir *= -1;
    if (!state.won && intersects(player, dog)) {
      resetPlayer();
      state.cameraX = 0;
    }
  });
}

function updatePlayer() {
  handleInput();
  updateMovingPlatforms();

  player.step += Math.abs(player.vx) * 0.15;

  player.vy += gravity;
  player.x += player.vx;
  player.y += player.vy;

  if (player.x < 0) player.x = 0;
  if (player.x + player.w > WORLD_WIDTH) player.x = WORLD_WIDTH - player.w;

  player.onGround = false;
  const colliders = allColliders();

  colliders.forEach(platform => {
    if (
      player.x + player.w > platform.x &&
      player.x < platform.x + platform.w &&
      player.y + player.h >= platform.y &&
      player.y + player.h - player.vy <= platform.y + 8 &&
      player.vy >= 0
    ) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
      if (platform.kind === "moving") {
        player.y = platform.y - player.h;
      }
    }
  });

  if (player.y > HEIGHT + 100) {
    resetPlayer();
    state.cameraX = Math.max(0, player.x - 200);
  }

  candles.forEach(candle => {
    if (!candle.collected && intersects(player, candle)) {
      candle.collected = true;
      state.collectedDigits.push(candle.digit);
    }
  });

  treats.forEach(t => {
    const bone = {x: t.x, y: t.y, w: 28, h: 18};
    if (!t.taken && intersects(player, bone)) {
      t.taken = true;
      bonusTreats++;
    }
  });

  if (!state.won && state.collectedDigits.length === 3 && intersects(player, goal)) {
    triggerWin();
  }

  state.cameraX = Math.max(0, Math.min(player.x - WIDTH * 0.35, WORLD_WIDTH - WIDTH));
}

function updateParticles() {
  champagneBurst.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.18;
    p.life -= 1;
  });

  confetti.forEach(c => {
    c.x += c.vx;
    c.y += c.vy;
    c.vy += 0.18;
    c.rot += c.vr;
  });
}

function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  g.addColorStop(0, "#8fe0ff");
  g.addColorStop(0.62, "#d3f3ff");
  g.addColorStop(1, "#ffe6d1");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#ffe37b";
  ctx.beginPath();
  ctx.arc(1160, 100, 48, 0, Math.PI * 2);
  ctx.fill();

  parallax.clouds.forEach(c => drawCloud(c.x - state.cameraX * 0.25, c.y, c.s));
  parallax.hills.forEach(h => drawHill(h.x - state.cameraX * 0.45, h.w, h.h, h.c1, h.c2));
}

function drawCloud(x, y, s) {
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.beginPath();
  ctx.arc(x, y, 24 * s, 0, Math.PI * 2);
  ctx.arc(x + 26 * s, y - 12 * s, 30 * s, 0, Math.PI * 2);
  ctx.arc(x + 62 * s, y, 24 * s, 0, Math.PI * 2);
  ctx.arc(x + 32 * s, y + 10 * s, 26 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawHill(x, w, h, c1, c2) {
  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.moveTo(x, FLOOR_Y + 16);
  ctx.quadraticCurveTo(x + w * 0.35, FLOOR_Y - h, x + w, FLOOR_Y + 16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = c2;
  ctx.beginPath();
  ctx.moveTo(x + 60, FLOOR_Y + 20);
  ctx.quadraticCurveTo(x + w * 0.45, FLOOR_Y - h * 0.65, x + w - 30, FLOOR_Y + 20);
  ctx.closePath();
  ctx.fill();
}

function drawGround() {
  groundSegments.forEach(g => {
    const x = g.x - state.cameraX;
    ctx.fillStyle = "#8b5a42";
    ctx.fillRect(x, FLOOR_Y, g.w, HEIGHT - FLOOR_Y);

    ctx.fillStyle = "#69ba63";
    ctx.fillRect(x, FLOOR_Y, g.w, 18);

    ctx.fillStyle = "#a96d54";
    for (let i = 0; i < g.w; i += 36) {
      ctx.fillRect(x + i + 4, FLOOR_Y + 30, 18, 8);
      ctx.fillRect(x + i + 14, FLOOR_Y + 54, 14, 8);
      ctx.fillRect(x + i + 2, FLOOR_Y + 82, 17, 8);
    }
  });
}

function roundedRect(x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function drawPlatforms() {
  platforms.forEach(p => {
    const x = p.x - state.cameraX;
    ctx.fillStyle = "#fff7fb";
    ctx.strokeStyle = "#7a4b70";
    ctx.lineWidth = 4;
    roundedRect(x, p.y, p.w, p.h, 10, true, true);
    ctx.fillStyle = "#ffd7ec";
    roundedRect(x + 6, p.y + 5, p.w - 12, p.h - 10, 8, true, false);
  });

  movingPlatforms.forEach(p => {
    const x = p.x - state.cameraX;
    ctx.fillStyle = "#fef7df";
    ctx.strokeStyle = "#846a2d";
    ctx.lineWidth = 4;
    roundedRect(x, p.y, p.w, p.h, 10, true, true);
    ctx.fillStyle = "#ffe591";
    roundedRect(x + 6, p.y + 5, p.w - 12, p.h - 10, 8, true, false);
  });
}

function drawCandle(candle) {
  if (candle.collected) return;
  const x = candle.x - state.cameraX;
  ctx.fillStyle = "#fff4ff";
  roundedRect(x, candle.y + 8, candle.w, candle.h - 8, 6, true, false);
  ctx.strokeStyle = "#c774b6";
  ctx.lineWidth = 2;
  roundedRect(x, candle.y + 8, candle.w, candle.h - 8, 6, false, true);

  ctx.fillStyle = "#ffb4de";
  ctx.fillRect(x + 5, candle.y + 11, 4, candle.h - 14);
  ctx.fillRect(x + 12, candle.y + 14, 4, candle.h - 18);

  ctx.fillStyle = "#ff7b00";
  ctx.beginPath();
  ctx.moveTo(x + candle.w / 2, candle.y - 8);
  ctx.quadraticCurveTo(x + candle.w - 1, candle.y + 8, x + candle.w / 2, candle.y + 10);
  ctx.quadraticCurveTo(x + 1, candle.y + 8, x + candle.w / 2, candle.y - 8);
  ctx.fill();

  ctx.fillStyle = "#ffe16c";
  ctx.beginPath();
  ctx.arc(x + candle.w / 2, candle.y + 2, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawCandles() {
  candles.forEach(drawCandle);
}

function drawDog(dog) {
  const x = dog.x - state.cameraX;
  const y = dog.y;
  ctx.save();

  if (dog.color === "brown") {
    ctx.fillStyle = "#9b623d";
  } else {
    ctx.fillStyle = "#ffffff";
  }

  roundedRect(x + 10, y + 10, dog.w - 16, dog.h - 10, 10, true, false);
  roundedRect(x, y + 14, 24, 18, 10, true, false);
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 12);
  ctx.lineTo(x + 5, y + 2);
  ctx.lineTo(x + 15, y + 10);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + 19, y + 12);
  ctx.lineTo(x + 18, y + 1);
  ctx.lineTo(x + 28, y + 10);
  ctx.fill();

  ctx.fillRect(x + 16, y + dog.h - 4, 6, 10);
  ctx.fillRect(x + 34, y + dog.h - 4, 6, 10);

  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(x + 15, y + 18, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 22, y + 22, 3.2, 0, Math.PI * 2);
  ctx.fill();

  if (dog.color === "white") {
    ctx.strokeStyle = "#cfcfcf";
    ctx.lineWidth = 2;
    roundedRect(x + 10, y + 10, dog.w - 16, dog.h - 10, 10, false, true);
    roundedRect(x, y + 14, 24, 18, 10, false, true);
  }

  ctx.restore();
}

function drawDogs() {
  dogs.forEach(drawDog);
}

function drawPlayer() {
  const x = player.x - state.cameraX;
  const y = player.y;
  const legSwing = Math.sin(player.step) * 5;

  ctx.save();

  ctx.fillStyle = "#2f4c8f";
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 30);
  ctx.quadraticCurveTo(x + 10, y + 42, x + 12, y + 68);
  ctx.lineTo(x + 16, y + 68);
  ctx.quadraticCurveTo(x + 20, y + 48, x + 32, y + 40);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f2c8b2";
  ctx.beginPath();
  ctx.arc(x + 28, y + 20, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f2d05b";
  ctx.beginPath();
  ctx.arc(x + 28, y + 15, 16, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + 12, y + 14, 32, 18);
  ctx.beginPath();
  ctx.moveTo(x + 40, y + 18);
  ctx.quadraticCurveTo(x + 56, y + 44, x + 42, y + 64);
  ctx.lineTo(x + 34, y + 52);
  ctx.quadraticCurveTo(x + 44, y + 35, x + 28, y + 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ff68a3";
  roundedRect(x + 16, y + 36, 28, 28, 10, true, false);

  ctx.fillStyle = "#f2c8b2";
  ctx.fillRect(x + 10, y + 38, 6, 24);
  ctx.fillRect(x + 44, y + 40, 6, 22);

  ctx.fillStyle = "#6a368b";
  ctx.fillRect(x + 20, y + 64, 8, 26 + legSwing * 0.15);
  ctx.fillRect(x + 33, y + 64, 8, 26 - legSwing * 0.15);

  ctx.fillStyle = "#53325d";
  ctx.fillRect(x + 17, y + 90, 14, 7);
  ctx.fillRect(x + 31, y + 90, 14, 7);

  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(x + 24, y + 20, 2, 0, Math.PI * 2);
  ctx.arc(x + 31, y + 20, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#8f5f5f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 28, y + 26, 5, 0.1, Math.PI - 0.1);
  ctx.stroke();

  ctx.restore();
}

function drawTreat(t) {
  if (t.taken) return;
  const x = t.x - state.cameraX;
  const y = t.y;
  ctx.fillStyle = "#fff2d8";
  roundedRect(x, y, 28, 14, 6, true, false);
  ctx.beginPath();
  ctx.arc(x + 3, y + 4, 5, 0, Math.PI * 2);
  ctx.arc(x + 3, y + 10, 5, 0, Math.PI * 2);
  ctx.arc(x + 25, y + 4, 5, 0, Math.PI * 2);
  ctx.arc(x + 25, y + 10, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c59d63";
  ctx.lineWidth = 2;
  roundedRect(x, y, 28, 14, 6, false, true);
}

function drawTreats() {
  treats.forEach(drawTreat);
}

function drawGoal() {
  const x = goal.x - state.cameraX;
  const y = goal.y;
  if (!state.exploded) {
    ctx.fillStyle = "#5a8e37";
    roundedRect(x + 22, y + 36, 24, 92, 8, true, false);

    ctx.fillStyle = "#f4e6a8";
    roundedRect(x + 18, y + 20, 32, 28, 10, true, false);

    ctx.fillStyle = "#ffe07a";
    ctx.fillRect(x + 20, y + 44, 28, 10);

    ctx.fillStyle = "#2d6a2d";
    ctx.beginPath();
    ctx.moveTo(x + 34, y + 12);
    ctx.lineTo(x + 24, y + 30);
    ctx.lineTo(x + 44, y + 30);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.fillText("POP", x + 16, y + 92);
  }
}

function drawSplashParticles() {
  champagneBurst.forEach(p => {
    if (p.life <= 0) return;
    const x = p.x - state.cameraX;
    ctx.fillStyle = "#f7f1cf";
    ctx.beginPath();
    ctx.arc(x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  confetti.forEach(c => {
    const x = c.x - state.cameraX;
    ctx.save();
    ctx.translate(x, c.y);
    ctx.rotate(c.rot);
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.7);
    ctx.restore();
  });
}

function drawHud() {
  ctx.fillStyle = "rgba(72,36,71,0.88)";
  roundedRect(18, 18, 278, 82, 18, true, false);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 24px Arial";
  ctx.fillText("Kerzen: " + state.collectedDigits.length + "/3", 34, 50);

  ctx.font = "18px Arial";
  ctx.fillText("Bonus-Hundekekse: " + bonusTreats, 34, 78);

  ctx.fillStyle = "rgba(72,36,71,0.88)";
  roundedRect(WIDTH - 270, 18, 252, 82, 18, true, false);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px Arial";
  ctx.fillText("Ziel: Sektflasche erreichen", WIDTH - 248, 48);
  ctx.fillText("und alle 3 Kerzen holen", WIDTH - 248, 74);
}

function drawIntroOverlay() {
  ctx.fillStyle = "rgba(45,25,53,0.55)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawComicPanel(170, 110, 1060, 430, "#fff8fb", "#5b2458");
  drawCake(235, 350);
  drawSpeaker(1020, 330);
  drawMiniDogs(960, 400);

  ctx.fillStyle = "#5b2458";
  ctx.textAlign = "center";
  ctx.font = "bold 42px Arial";
  ctx.fillText(state.introLines[0], WIDTH / 2, 195);

  ctx.font = "30px Arial";
  ctx.fillText(state.introLines[1], WIDTH / 2, 250);
  ctx.fillText(state.introLines[2], WIDTH / 2, 302);
  ctx.fillText(state.introLines[3], WIDTH / 2, 346);
  ctx.fillText(state.introLines[4], WIDTH / 2, 405);

  drawStartButton();
  ctx.textAlign = "left";
}

function drawComicPanel(x, y, w, h, fill, stroke) {
  ctx.fillStyle = fill;
  roundedRect(x, y, w, h, 28, true, false);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 8;
  roundedRect(x, y, w, h, 28, false, true);

  ctx.strokeStyle = "rgba(255,148,200,0.6)";
  ctx.lineWidth = 4;
  roundedRect(x + 16, y + 16, w - 32, h - 32, 24, false, true);
}

function drawCake(x, y) {
  ctx.fillStyle = "#ffe9a8";
  roundedRect(x, y, 130, 50, 14, true, false);
  ctx.fillStyle = "#ffb5d8";
  roundedRect(x, y - 28, 130, 34, 14, true, false);
  ctx.fillStyle = "#fff";
  ctx.fillRect(x + 18, y - 40, 10, 16);
  ctx.fillRect(x + 58, y - 40, 10, 16);
  ctx.fillRect(x + 98, y - 40, 10, 16);
  ctx.fillStyle = "#ff9f1c";
  ctx.beginPath(); ctx.arc(x + 23, y - 44, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 63, y - 44, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 103, y - 44, 5, 0, Math.PI * 2); ctx.fill();
}

function drawSpeaker(x, y) {
  ctx.fillStyle = "#3f3f56";
  roundedRect(x, y, 110, 140, 18, true, false);
  ctx.fillStyle = "#202028";
  ctx.beginPath(); ctx.arc(x + 55, y + 50, 28, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 55, y + 104, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px Arial";
  ctx.fillText("LP", x + 43, y + 12);
}

function drawMiniDogs(x, y) {
  const oldCam = state.cameraX;
  state.cameraX = 0;
  drawDog({x:x, y:y, w:58, h:30, color:"brown"});
  drawDog({x:x+84, y:y+2, w:58, h:30, color:"white"});
  state.cameraX = oldCam;
}

function drawWinOverlay() {
  ctx.fillStyle = "rgba(34,20,40,0.58)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawComicPanel(180, 115, 1040, 420, "#fffef8", "#4f2751");

  ctx.fillStyle = "#4f2751";
  ctx.textAlign = "center";
  ctx.font = "bold 52px Arial";
  ctx.fillText("Geschafft!", WIDTH / 2, 195);

  ctx.font = "30px Arial";
  ctx.fillText("Happy Birthday Virág! 🎉", WIDTH / 2, 250);
  ctx.fillText("Du hast alle Kerzen gesammelt", WIDTH / 2, 300);
  ctx.fillText("und die Sektflasche geknackt!", WIDTH / 2, 342);

  ctx.fillStyle = "#ff4f8b";
  roundedRect(WIDTH / 2 - 190, 380, 380, 84, 22, true, false);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 58px Arial";
  ctx.fillText(state.collectedDigits.join(" "), WIDTH / 2, 438);

  ctx.font = "20px Arial";
  ctx.fillStyle = "#4f2751";
  ctx.fillText("Bonus-Hundekekse gesammelt: " + bonusTreats, WIDTH / 2, 490);

  drawCake(265, 400);
  drawSpeaker(1000, 360);
  ctx.textAlign = "left";
}

function render() {
  drawSky();
  drawGround();
  drawPlatforms();
  drawTreats();
  drawCandles();
  drawDogs();
  drawGoal();
  drawPlayer();
  drawSplashParticles();
  drawHud();

  if (!state.started) drawIntroOverlay();
  if (state.won) drawWinOverlay();
}

function update() {
  if (state.started && !state.won) {
    updateDogs();
    updatePlayer();
  } else {
    updateMovingPlatforms();
  }
  updateParticles();
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

function pressJump() {
  controls.jump = true;
  if (!state.started) startGame();
}

document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft") { controls.left = true; if (!state.started) startGame(); }
  if (e.code === "ArrowRight") { controls.right = true; if (!state.started) startGame(); }
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    pressJump();
  }
});

document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft") controls.left = false;
  if (e.code === "ArrowRight") controls.right = false;
  if (e.code === "Space" || e.code === "ArrowUp") controls.jump = false;
});

function bindHoldButton(id, onPress, onRelease) {
  const el = document.getElementById(id);
  const start = (ev) => { ev.preventDefault(); onPress(); };
  const end = (ev) => { ev.preventDefault(); onRelease(); };
  el.addEventListener("touchstart", start, { passive: false });
  el.addEventListener("touchend", end, { passive: false });
  el.addEventListener("touchcancel", end, { passive: false });
  el.addEventListener("mousedown", start);
  el.addEventListener("mouseup", end);
  el.addEventListener("mouseleave", end);
}

bindHoldButton("leftBtn", () => {
  if (!state.started) startGame();
  controls.left = true;
}, () => controls.left = false);

bindHoldButton("rightBtn", () => {
  if (!state.started) startGame();
  controls.right = true;
}, () => controls.right = false);

bindHoldButton("jumpBtn", () => pressJump(), () => controls.jump = false);

function startButtonBounds() {
  return {x: WIDTH/2 - 150, y: 445, w: 300, h: 64};
}

function drawStartButton() {
  const b = startButtonBounds();
  const pulse = 1 + Math.sin(Date.now() * 0.006) * 0.03;
  const w = b.w * pulse, h = b.h * pulse;
  const x = b.x - (w - b.w)/2, y = b.y - (h - b.h)/2;

  ctx.fillStyle = "#ff5c9c";
  roundedRect(x, y, w, h, 22, true, false);
  ctx.strokeStyle = "#5b2458";
  ctx.lineWidth = 6;
  roundedRect(x, y, w, h, 22, false, true);

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "bold 30px Arial";
  ctx.fillText("Spiel starten", WIDTH / 2, y + 42);
  ctx.textAlign = "left";
}

function clickStart(x, y) {
  const b = startButtonBounds();
  if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
    startGame();
  }
}

canvas.addEventListener("click", (e) => {
  if (state.started) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = WIDTH / rect.width;
  const scaleY = HEIGHT / rect.height;
  clickStart((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
});

canvas.addEventListener("touchstart", (e) => {
  if (state.started) return;
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const scaleX = WIDTH / rect.width;
  const scaleY = HEIGHT / rect.height;
  clickStart((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
}, { passive: true });

resetPlayer();
loop();
