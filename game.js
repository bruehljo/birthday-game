const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const FLOOR_Y = 470;

const state = {
  started: false,
  won: false,
  codeDigits: ["4", "2", "1"],
  collectedDigits: [],
  introLines: [
    "Liebe Virág!",
    "Wir wünschen Dir alles Liebe und Gute zum Geburtstag!",
    "Erst mit Hilfe dieses Spiels bekommst Du die Möglichkeit",
    "Dein Geburtstagsgeschenk zu öffnen.",
    "Wir wünschen Dir viel Spaß :)!"
  ]
};

const player = {
  x: 72,
  y: FLOOR_Y - 52,
  w: 34,
  h: 52,
  vx: 0,
  vy: 0,
  speed: 3.8,
  jumpPower: 12.5,
  onGround: false,
  facing: 1
};

const controls = {
  left: false,
  right: false,
  jump: false
};

const gravity = 0.55;
const friction = 0.82;

const platforms = [
  { x: 0, y: FLOOR_Y, w: 280, h: 70, type: "ground" },
  { x: 320, y: FLOOR_Y, w: 180, h: 70, type: "ground" },
  { x: 545, y: FLOOR_Y, w: 165, h: 70, type: "ground" },
  { x: 760, y: FLOOR_Y, w: 200, h: 70, type: "ground" },

  { x: 180, y: 392, w: 92, h: 16, type: "dumbbell" },
  { x: 335, y: 334, w: 112, h: 16, type: "dumbbell" },
  { x: 510, y: 280, w: 96, h: 16, type: "dumbbell" },
  { x: 650, y: 228, w: 100, h: 16, type: "dumbbell" },
  { x: 800, y: 170, w: 90, h: 16, type: "dumbbell" }
];

const candles = [
  { x: 206, y: 352, w: 20, h: 32, collected: false, digit: state.codeDigits[0] },
  { x: 548, y: 240, w: 20, h: 32, collected: false, digit: state.codeDigits[1] },
  { x: 828, y: 130, w: 20, h: 32, collected: false, digit: state.codeDigits[2] }
];

const dogs = [
  { x: 355, y: FLOOR_Y - 26, w: 42, h: 26, minX: 345, maxX: 450, speed: 1.15, dir: 1 },
  { x: 585, y: FLOOR_Y - 26, w: 42, h: 26, minX: 560, maxX: 650, speed: 1.4, dir: -1 }
];

const decorations = {
  clouds: [
    { x: 120, y: 80, s: 1.1 },
    { x: 430, y: 64, s: 0.9 },
    { x: 760, y: 92, s: 1.2 }
  ],
  mountains: [
    { x: 40, w: 220, h: 120 },
    { x: 250, w: 250, h: 160 },
    { x: 520, w: 230, h: 140 },
    { x: 720, w: 210, h: 120 }
  ],
  confetti: []
};

function resetPlayer() {
  player.x = 72;
  player.y = FLOOR_Y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
}

function createConfetti() {
  decorations.confetti = [];
  for (let i = 0; i < 120; i++) {
    decorations.confetti.push({
      x: Math.random() * WIDTH,
      y: -Math.random() * HEIGHT,
      vy: 1.5 + Math.random() * 2.5,
      vx: -1 + Math.random() * 2,
      size: 4 + Math.random() * 6,
      color: ["#ff4d6d", "#ffd166", "#06d6a0", "#118ab2", "#8338ec"][Math.floor(Math.random() * 5)]
    });
  }
}

function triggerWin() {
  if (state.won) return;
  state.won = true;
  createConfetti();
}

function intersects(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
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
    if (Math.abs(player.vx) < 0.05) player.vx = 0;
  }

  if (controls.jump && player.onGround) {
    player.vy = -player.jumpPower;
    player.onGround = false;
  }
}

function updateDogs() {
  dogs.forEach(dog => {
    dog.x += dog.speed * dog.dir;
    if (dog.x <= dog.minX || dog.x + dog.w >= dog.maxX) {
      dog.dir *= -1;
    }

    if (intersects(player, dog)) {
      resetPlayer();
    }
  });
}

function updatePlayer() {
  handleInput();

  player.vy += gravity;
  player.x += player.vx;
  player.y += player.vy;

  if (player.x < 0) player.x = 0;
  if (player.x + player.w > WIDTH) player.x = WIDTH - player.w;

  player.onGround = false;

  platforms.forEach(platform => {
    if (
      player.x + player.w > platform.x &&
      player.x < platform.x + platform.w &&
      player.y + player.h >= platform.y &&
      player.y + player.h - player.vy <= platform.y &&
      player.vy >= 0
    ) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  });

  if (player.y > HEIGHT + 80) {
    resetPlayer();
  }

  candles.forEach(candle => {
    if (!candle.collected && intersects(player, candle)) {
      candle.collected = true;
      state.collectedDigits.push(candle.digit);
    }
  });

  if (!state.won && candles.every(c => c.collected) && player.x > 875 && player.y < 220) {
    triggerWin();
  }
}

function updateConfetti() {
  decorations.confetti.forEach(c => {
    c.x += c.vx;
    c.y += c.vy;
    if (c.y > HEIGHT + 20) {
      c.y = -10;
      c.x = Math.random() * WIDTH;
    }
  });
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#87ceeb");
  gradient.addColorStop(0.65, "#bde9ff");
  gradient.addColorStop(1, "#ffe6ef");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawSun(855, 85, 38);
  decorations.clouds.forEach(cloud => drawCloud(cloud.x, cloud.y, cloud.s));

  decorations.mountains.forEach(m => {
    ctx.fillStyle = "#b88bc0";
    ctx.beginPath();
    ctx.moveTo(m.x, FLOOR_Y);
    ctx.lineTo(m.x + m.w / 2, FLOOR_Y - m.h);
    ctx.lineTo(m.x + m.w, FLOOR_Y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#d7b1df";
    ctx.beginPath();
    ctx.moveTo(m.x + m.w / 2, FLOOR_Y - m.h);
    ctx.lineTo(m.x + m.w * 0.65, FLOOR_Y - m.h * 0.45);
    ctx.lineTo(m.x + m.w * 0.42, FLOOR_Y - m.h * 0.38);
    ctx.closePath();
    ctx.fill();
  });

  ctx.fillStyle = "#7cc36f";
  ctx.fillRect(0, FLOOR_Y + 52, WIDTH, HEIGHT - FLOOR_Y);
}

function drawSun(x, y, r) {
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawCloud(x, y, s) {
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.arc(x, y, 18 * s, 0, Math.PI * 2);
  ctx.arc(x + 22 * s, y - 10 * s, 22 * s, 0, Math.PI * 2);
  ctx.arc(x + 48 * s, y, 18 * s, 0, Math.PI * 2);
  ctx.arc(x + 24 * s, y + 8 * s, 20 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawGroundTile(x, y, w, h) {
  ctx.fillStyle = "#7b4b3a";
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "#a96c54";
  for (let i = 0; i < w; i += 24) {
    ctx.fillRect(x + i, y + 8, 12, 6);
    ctx.fillRect(x + i + 8, y + 24, 10, 6);
    ctx.fillRect(x + i + 2, y + 40, 13, 6);
  }

  ctx.fillStyle = "#64b85b";
  ctx.fillRect(x, y, w, 10);
}

function drawDumbbellPlatform(x, y, w, h) {
  ctx.fillStyle = "#5d6470";
  ctx.fillRect(x + 12, y + 4, w - 24, h - 8);
  ctx.fillStyle = "#2d3440";
  ctx.fillRect(x, y, 14, h);
  ctx.fillRect(x + w - 14, y, 14, h);
}

function drawPlatforms() {
  platforms.forEach(p => {
    if (p.type === "ground") {
      drawGroundTile(p.x, p.y, p.w, p.h);
    } else {
      drawDumbbellPlatform(p.x, p.y, p.w, p.h);
    }
  });
}

function drawCandle(candle) {
  if (candle.collected) return;
  ctx.fillStyle = "#ffd6f4";
  ctx.fillRect(candle.x, candle.y + 8, candle.w, candle.h - 8);
  ctx.fillStyle = "#ff7b00";
  ctx.beginPath();
  ctx.moveTo(candle.x + candle.w / 2, candle.y - 6);
  ctx.lineTo(candle.x + candle.w - 2, candle.y + 8);
  ctx.lineTo(candle.x + 2, candle.y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffe066";
  ctx.beginPath();
  ctx.arc(candle.x + candle.w / 2, candle.y + 2, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawCandles() {
  candles.forEach(drawCandle);
}

function drawDog(dog) {
  ctx.fillStyle = "#9a5c35";
  ctx.fillRect(dog.x + 8, dog.y + 6, dog.w - 12, dog.h - 10);
  ctx.fillRect(dog.x, dog.y + 12, 16, 12);
  ctx.fillRect(dog.x + dog.w - 10, dog.y + 10, 10, 8);
  ctx.fillStyle = "#6f3f22";
  ctx.fillRect(dog.x + 6, dog.y, 10, 10);
  ctx.fillRect(dog.x + 16, dog.y + 2, 8, 8);
  ctx.fillRect(dog.x + 10, dog.y + dog.h - 4, 5, 4);
  ctx.fillRect(dog.x + 24, dog.y + dog.h - 4, 5, 4);
}

function drawDogs() {
  dogs.forEach(drawDog);
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.fillStyle = "#ff5da2";
  ctx.fillRect(8, 10, 18, 24);

  ctx.fillStyle = "#292929";
  ctx.fillRect(6, 4, 22, 10);

  ctx.fillStyle = "#f4c9a8";
  ctx.fillRect(10, 0, 14, 14);

  ctx.fillStyle = "#4d2f5f";
  ctx.fillRect(8, 34, 7, 18);
  ctx.fillRect(19, 34, 7, 18);

  ctx.fillStyle = "#f4c9a8";
  ctx.fillRect(4, 14, 4, 16);
  ctx.fillRect(26, 14, 4, 16);

  ctx.restore();
}

function drawHud() {
  ctx.fillStyle = "rgba(59,34,64,0.88)";
  ctx.fillRect(14, 14, 220, 64);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px Arial";
  ctx.fillText("Kerzen: " + state.collectedDigits.length + "/3", 28, 42);
  ctx.font = "16px Arial";
  ctx.fillText("Ziel: oben rechts ins Herz", 28, 66);
}

function drawGoal() {
  const x = 900;
  const y = 120;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, 6, 68);

  ctx.fillStyle = "#ff4d8d";
  ctx.beginPath();
  ctx.moveTo(x + 28, y + 14);
  ctx.bezierCurveTo(x + 28, y, x + 10, y, x + 10, y + 16);
  ctx.bezierCurveTo(x + 10, y + 28, x + 28, y + 36, x + 28, y + 44);
  ctx.bezierCurveTo(x + 28, y + 36, x + 46, y + 28, x + 46, y + 16);
  ctx.bezierCurveTo(x + 46, y, x + 28, y, x + 28, y + 14);
  ctx.fill();
}

function drawIntroOverlay() {
  ctx.fillStyle = "rgba(28,20,35,0.70)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#fff8fb";
  ctx.fillRect(105, 88, 750, 290);

  ctx.strokeStyle = "#ff88b7";
  ctx.lineWidth = 4;
  ctx.strokeRect(105, 88, 750, 290);

  ctx.fillStyle = "#3b2240";
  ctx.textAlign = "center";
  ctx.font = "bold 30px Arial";
  ctx.fillText(state.introLines[0], WIDTH / 2, 145);

  ctx.font = "24px Arial";
  ctx.fillText(state.introLines[1], WIDTH / 2, 190);
  ctx.fillText(state.introLines[2], WIDTH / 2, 232);
  ctx.fillText(state.introLines[3], WIDTH / 2, 268);
  ctx.fillText(state.introLines[4], WIDTH / 2, 320);

  drawStartButton();
  ctx.textAlign = "left";
}

function drawStartButton() {
  const bx = WIDTH / 2 - 110;
  const by = 340;
  const bw = 220;
  const bh = 54;

  ctx.fillStyle = "#ff5da2";
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = "#3b2240";
  ctx.lineWidth = 4;
  ctx.strokeRect(bx, by, bw, bh);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "bold 24px Arial";
  ctx.fillText("Spiel starten", WIDTH / 2, by + 35);
  ctx.textAlign = "left";
}

function drawWinOverlay() {
  ctx.fillStyle = "rgba(22,18,30,0.64)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#fff8fb";
  ctx.fillRect(180, 110, 600, 250);
  ctx.strokeStyle = "#ff88b7";
  ctx.lineWidth = 4;
  ctx.strokeRect(180, 110, 600, 250);

  ctx.textAlign = "center";
  ctx.fillStyle = "#3b2240";
  ctx.font = "bold 42px Arial";
  ctx.fillText("Geschafft!", WIDTH / 2, 170);

  ctx.font = "26px Arial";
  ctx.fillText("Happy Birthday Virág! 🎉", WIDTH / 2, 218);
  ctx.fillText("Dein Geschenk-Code ist:", WIDTH / 2, 258);

  ctx.font = "bold 58px Arial";
  ctx.fillStyle = "#ff4d8d";
  ctx.fillText(state.collectedDigits.join(" "), WIDTH / 2, 324);
  ctx.textAlign = "left";
}

function drawConfetti() {
  decorations.confetti.forEach(c => {
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x, c.y, c.size, c.size);
  });
}

function render() {
  drawSky();
  drawPlatforms();
  drawGoal();
  drawCandles();
  drawDogs();
  drawPlayer();
  drawHud();

  if (!state.started) drawIntroOverlay();
  if (state.won) {
    drawConfetti();
    drawWinOverlay();
  }
}

function update() {
  if (state.started && !state.won) {
    updateDogs();
    updatePlayer();
  }
  if (state.won) updateConfetti();
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

function pressJump() {
  controls.jump = true;
  if (!state.started) state.started = true;
  setTimeout(() => {
    controls.jump = false;
  }, 120);
}

document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft") controls.left = true;
  if (e.code === "ArrowRight") controls.right = true;
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
  const start = (ev) => {
    ev.preventDefault();
    onPress();
  };
  const end = (ev) => {
    ev.preventDefault();
    onRelease();
  };
  el.addEventListener("touchstart", start, { passive: false });
  el.addEventListener("touchend", end, { passive: false });
  el.addEventListener("touchcancel", end, { passive: false });
  el.addEventListener("mousedown", start);
  el.addEventListener("mouseup", end);
  el.addEventListener("mouseleave", end);
}

bindHoldButton("leftBtn", () => {
  if (!state.started) state.started = true;
  controls.left = true;
}, () => {
  controls.left = false;
});

bindHoldButton("rightBtn", () => {
  if (!state.started) state.started = true;
  controls.right = true;
}, () => {
  controls.right = false;
});

bindHoldButton("jumpBtn", () => {
  pressJump();
}, () => {
  controls.jump = false;
});

canvas.addEventListener("click", (e) => {
  if (state.started) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = WIDTH / rect.width;
  const scaleY = HEIGHT / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  const bx = WIDTH / 2 - 110;
  const by = 340;
  const bw = 220;
  const bh = 54;

  if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
    state.started = true;
  }
});

canvas.addEventListener("touchstart", (e) => {
  if (state.started) return;
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const scaleX = WIDTH / rect.width;
  const scaleY = HEIGHT / rect.height;
  const x = (touch.clientX - rect.left) * scaleX;
  const y = (touch.clientY - rect.top) * scaleY;

  const bx = WIDTH / 2 - 110;
  const by = 340;
  const bw = 220;
  const bh = 54;

  if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
    state.started = true;
  }
}, { passive: true });

resetPlayer();
loop();
