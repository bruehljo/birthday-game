const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const candlesLabel = document.getElementById('candles');
const timerLabel = document.getElementById('timer');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');

const CONFIG = {
  gravity: 1800,
  moveSpeed: 250,
  jumpSpeed: 660,
  worldWidth: 2800,
  groundY: 460,
  codeDigits: ['4', '2', '1'], // <- hier den Geschenk-Code anpassen
  playerName: 'Virág',
};

const state = {
  running: false,
  won: false,
  elapsed: 0,
  pressed: { left: false, right: false, jump: false },
  cameraX: 0,
  player: null,
  candles: [],
  platforms: [],
  goal: null,
  confetti: [],
};

function resetGame() {
  state.running = false;
  state.won = false;
  state.elapsed = 0;
  state.cameraX = 0;
  state.player = {
    x: 80,
    y: 360,
    w: 36,
    h: 48,
    vx: 0,
    vy: 0,
    onGround: false,
    collected: [],
  };

  state.platforms = [
    { x: 0, y: 460, w: 620, h: 80 },
    { x: 700, y: 420, w: 180, h: 120 },
    { x: 940, y: 360, w: 180, h: 180 },
    { x: 1180, y: 300, w: 170, h: 240 },
    { x: 1420, y: 360, w: 170, h: 180 },
    { x: 1650, y: 430, w: 260, h: 110 },
    { x: 1980, y: 370, w: 180, h: 170 },
    { x: 2220, y: 310, w: 160, h: 230 },
    { x: 2440, y: 250, w: 160, h: 290 },
    { x: 2640, y: 460, w: 260, h: 80 },
  ];

  state.candles = [
    { x: 790, y: 370, collected: false, digit: CONFIG.codeDigits[0] },
    { x: 1495, y: 310, collected: false, digit: CONFIG.codeDigits[1] },
    { x: 2475, y: 200, collected: false, digit: CONFIG.codeDigits[2] },
  ];

  state.goal = { x: 2750, y: 360, w: 32, h: 100 };
  state.confetti = [];
  updateHud();
  showIntro();
  draw();
}

function showIntro() {
  overlay.innerHTML = `
    <div class="card">
      <h2>🎉 Happy Birthday!</h2>
      <p><strong>${CONFIG.playerName}</strong>, sammle die 3 Kerzen und erreiche die Zielflagge.</p>
      <p>Jede Kerze steht für eine Zahl deines Geschenk-Codes. Am Ziel werden alle 3 Zahlen angezeigt.</p>
      <p class="small">Steuerung: A/D oder ←/→ laufen · W/↑/Leertaste springen · unten auch per Touch</p>
      <button id="startBtnInner" type="button">Los geht's</button>
    </div>
  `;
  overlay.classList.remove('hidden');
  document.getElementById('startBtnInner').addEventListener('click', startGame);
}

function showWin() {
  const digits = state.player.collected.map(c => c.digit);
  overlay.innerHTML = `
    <div class="card">
      <h2>🎂 Geschafft!</h2>
      <p>Alles Gute zum Geburtstag! Du hast alle Kerzen eingesammelt.</p>
      <p>Dein Geschenk-Code lautet:</p>
      <div class="code-display">
        ${digits.map(d => `<div class="digit">${d}</div>`).join('')}
      </div>
      <p><strong>Code:</strong> ${digits.join('')}</p>
      <p class="small">Diesen Code kannst du jetzt für das Geschenk verwenden.</p>
      <button id="restartBtnInner" type="button">Nochmal spielen</button>
    </div>
  `;
  overlay.classList.remove('hidden');
  document.getElementById('restartBtnInner').addEventListener('click', () => {
    resetGame();
    startGame();
  });
}

function startGame() {
  overlay.classList.add('hidden');
  state.running = true;
}

function updateHud() {
  candlesLabel.textContent = `${state.player.collected.length} / 3`;
  timerLabel.textContent = `${state.elapsed.toFixed(1)}s`;
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update(dt) {
  const p = state.player;
  if (!state.running || state.won) return;

  state.elapsed += dt;

  const movingLeft = state.pressed.left && !state.pressed.right;
  const movingRight = state.pressed.right && !state.pressed.left;
  p.vx = movingLeft ? -CONFIG.moveSpeed : movingRight ? CONFIG.moveSpeed : 0;

  if (state.pressed.jump && p.onGround) {
    p.vy = -CONFIG.jumpSpeed;
    p.onGround = false;
  }

  p.vy += CONFIG.gravity * dt;
  p.x += p.vx * dt;

  // horizontal bounds
  if (p.x < 0) p.x = 0;
  if (p.x + p.w > CONFIG.worldWidth) p.x = CONFIG.worldWidth - p.w;

  p.y += p.vy * dt;
  p.onGround = false;

  // collide with platforms from above
  for (const plat of state.platforms) {
    if (
      p.x + p.w > plat.x &&
      p.x < plat.x + plat.w &&
      p.y + p.h >= plat.y &&
      p.y + p.h <= plat.y + plat.h + 18 &&
      p.vy >= 0
    ) {
      p.y = plat.y - p.h;
      p.vy = 0;
      p.onGround = true;
    }
  }

  if (p.y > canvas.height + 240) {
    // reset from fall
    p.x = 80;
    p.y = 360;
    p.vx = 0;
    p.vy = 0;
  }

  for (const candle of state.candles) {
    if (!candle.collected && intersects(p, { ...candle, w: 24, h: 42 })) {
      candle.collected = true;
      state.player.collected.push(candle);
    }
  }

  if (
    state.player.collected.length === 3 &&
    intersects(p, state.goal)
  ) {
    state.won = true;
    state.running = false;
    spawnConfetti();
    showWin();
  }

  state.cameraX = Math.max(0, Math.min(p.x - canvas.width / 2 + p.w / 2, CONFIG.worldWidth - canvas.width));
  updateHud();
}

function spawnConfetti() {
  state.confetti = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 100,
    vy: 60 + Math.random() * 120,
    size: 4 + Math.random() * 6,
  }));
}

function updateConfetti(dt) {
  for (const c of state.confetti) {
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    if (c.y > canvas.height + 20) {
      c.y = -10;
      c.x = Math.random() * canvas.width;
    }
  }
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#7dd3fc');
  grad.addColorStop(1, '#dbeafe');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // clouds
  const clouds = [
    [140, 90, 90], [380, 130, 70], [650, 100, 100], [880, 85, 85], [1160, 130, 90], [1500, 90, 110], [1880, 120, 95], [2250, 90, 85], [2600, 130, 90],
  ];
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (const [x0, y, s] of clouds) {
    const x = x0 - state.cameraX * 0.45;
    drawCloud(x, y, s);
  }

  // hills
  for (let i = 0; i < 8; i++) {
    const x = i * 380 - (state.cameraX * 0.25 % 380);
    drawHill(x, 420, 260, 120, '#86efac');
    drawHill(x + 160, 440, 220, 90, '#4ade80');
  }
}

function drawCloud(x, y, s) {
  ctx.beginPath();
  ctx.arc(x, y, s * 0.22, 0, Math.PI * 2);
  ctx.arc(x + s * 0.2, y - s * 0.08, s * 0.28, 0, Math.PI * 2);
  ctx.arc(x + s * 0.45, y, s * 0.24, 0, Math.PI * 2);
  ctx.fill();
}

function drawHill(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + w / 2, y - h, x + w, y);
  ctx.closePath();
  ctx.fill();
}

function drawGroundTile(x, y, w, h) {
  ctx.fillStyle = '#8b5e34';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#65a30d';
  ctx.fillRect(x, y, w, 16);

  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  for (let ix = 0; ix < w; ix += 28) {
    ctx.beginPath();
    ctx.moveTo(x + ix, y + 16);
    ctx.lineTo(x + ix, y + h);
    ctx.stroke();
  }
}

function drawCandle(c) {
  const x = c.x - state.cameraX;
  const y = c.y;
  if (c.collected) return;
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(x, y, 14, 28);
  ctx.fillStyle = '#fb7185';
  ctx.fillRect(x + 2, y + 2, 10, 4);
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.ellipse(x + 7, y - 4, 6, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawGoal(goal) {
  const x = goal.x - state.cameraX;
  ctx.fillStyle = '#6b7280';
  ctx.fillRect(x, goal.y, 6, goal.h);
  ctx.fillStyle = '#ec4899';
  ctx.fillRect(x + 6, goal.y + 10, 30, 20);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 14, goal.y + 18, 6, 6);
}

function drawPlayer(p) {
  const x = p.x - state.cameraX;
  const y = p.y;

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(x + 6, CONFIG.groundY + 40, 22, 6);

  // body
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(x + 8, y + 12, 20, 22);
  // overalls
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(x + 8, y + 24, 20, 18);
  // head
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(x + 10, y, 16, 16);
  // cap
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(x + 8, y - 4, 20, 8);
  // legs
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(x + 10, y + 42, 6, 6);
  ctx.fillRect(x + 20, y + 42, 6, 6);
}

function drawCollectedBanner() {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.68)';
  ctx.fillRect(20, 16, 220, 54);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Kerzen-Code:', 32, 38);
  state.player.collected.forEach((c, i) => {
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(144 + i * 28, 22, 22, 30);
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(c.digit, 150 + i * 28, 43);
  });
}

function draw() {
  drawBackground();

  for (const plat of state.platforms) {
    drawGroundTile(plat.x - state.cameraX, plat.y, plat.w, plat.h);
  }

  for (const candle of state.candles) {
    drawCandle(candle);
  }

  drawGoal(state.goal);
  drawPlayer(state.player);
  drawCollectedBanner();

  if (state.won) {
    updateConfetti(1 / 60);
    for (const c of state.confetti) {
      ctx.fillStyle = ['#fbbf24', '#60a5fa', '#f472b6', '#34d399'][Math.floor((c.x + c.y) % 4)];
      ctx.fillRect(c.x, c.y, c.size, c.size);
    }
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function setButtonHold(btn, key, value) {
  const apply = (e) => {
    e.preventDefault();
    state.pressed[key] = value;
  };
  btn.addEventListener('pointerdown', (e) => apply(e));
  btn.addEventListener('pointerup', (e) => apply(e));
  btn.addEventListener('pointercancel', (e) => apply(e));
  btn.addEventListener('pointerleave', (e) => apply(e));
}

setButtonHold(leftBtn, 'left', true);
leftBtn.addEventListener('pointerup', () => state.pressed.left = false);
leftBtn.addEventListener('pointerleave', () => state.pressed.left = false);
setButtonHold(rightBtn, 'right', true);
rightBtn.addEventListener('pointerup', () => state.pressed.right = false);
rightBtn.addEventListener('pointerleave', () => state.pressed.right = false);

jumpBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); state.pressed.jump = true; });
jumpBtn.addEventListener('pointerup', (e) => { e.preventDefault(); state.pressed.jump = false; });
jumpBtn.addEventListener('pointerleave', () => state.pressed.jump = false);
jumpBtn.addEventListener('pointercancel', () => state.pressed.jump = false);

window.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) state.pressed.left = true;
  if (['ArrowRight', 'd', 'D'].includes(e.key)) state.pressed.right = true;
  if (['ArrowUp', 'w', 'W', ' '].includes(e.key)) state.pressed.jump = true;
});
window.addEventListener('keyup', (e) => {
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) state.pressed.left = false;
  if (['ArrowRight', 'd', 'D'].includes(e.key)) state.pressed.right = false;
  if (['ArrowUp', 'w', 'W', ' '].includes(e.key)) state.pressed.jump = false;
});

restartBtn.addEventListener('click', () => {
  resetGame();
  startGame();
});

resetGame();
