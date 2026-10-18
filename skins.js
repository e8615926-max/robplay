'use strict';

// ============================================================
//  Скины робота и их отрисовка
// ============================================================
// acc — аксессуар, trail — след при беге, req — условие открытия
const SKINS = [
  { id: 'classic', name: 'Классик', price: 0, body: '#6fd3ff', dark: '#2f87c4', eye: '#8ff7ff' },
  { id: 'mint', name: 'Мятный', price: 40, body: '#7af0c1', dark: '#2aa77a', eye: '#e9fff6' },
  { id: 'sunny', name: 'Солнечный', price: 60, body: '#ffd54a', dark: '#c49a00', eye: '#fff6c2' },
  { id: 'rose', name: 'Розочка', price: 90, body: '#ff9fcf', dark: '#c04f95', eye: '#ffe0f2', acc: 'bow' },
  { id: 'cowboy', name: 'Ковбой', price: 120, body: '#d9a066', dark: '#8f5a2b', eye: '#8ff7ff', acc: 'hat' },
  { id: 'ninja', name: 'Ниндзя', price: 150, body: '#3a3f55', dark: '#1b1e2b', eye: '#ff3b3b', acc: 'band', trail: 'smoke' },
  { id: 'dj', name: 'Диджей', price: 200, body: '#56e39f', dark: '#1f8a58', eye: '#ffffff', acc: 'phones', trail: 'notes' },
  { id: 'king', name: 'Король', price: 260, body: '#b48cff', dark: '#6b3fc4', eye: '#ffffff', acc: 'crown', trail: 'sparkle' },
  { id: 'devil', name: 'Чертёнок', price: 320, body: '#ff5d5d', dark: '#9a1f1f', eye: '#ffd54a', acc: 'horns', trail: 'fire' },
  { id: 'angel', name: 'Ангел', price: 320, body: '#ffffff', dark: '#b8c4e0', eye: '#6fd3ff', acc: 'halo', trail: 'sparkle' },
  { id: 'ghost', name: 'Призрак', price: 400, body: '#e8f0ff', dark: '#9aa8c8', eye: '#1b1b2a', alpha: 0.72, trail: 'ghost' },
  { id: 'magma', name: 'Магма', price: 550, body: '#ff6a3d', dark: '#5a1a0a', eye: '#ffd54a', glow: '#ff8a3d', trail: 'fire' },
  { id: 'gold', name: 'Золотой', price: 700, body: '#ffd700', dark: '#b8860b', eye: '#ffffff', acc: 'crown', glow: '#ffe066', trail: 'gold' },
  { id: 'rainbow', name: 'Радужный', price: 999, rainbow: true, dark: '#4a4a66', eye: '#ffffff', trail: 'rainbow' },
  { id: 'champion', name: 'Чемпион', price: 0, req: 'final', body: '#2e3a8c', dark: '#ffd54a', eye: '#ffd54a', acc: 'crown', glow: '#8fe9ff', trail: 'rainbow' },
];

function skinById(id) { return SKINS.find(s => s.id === id) || SKINS[0]; }
function currentSkin() { return skinById(Save.data.skin); }

function skinBody(skin, t) {
  if (skin.rainbow) return `hsl(${(t * 120) % 360}, 85%, 65%)`;
  return skin.body;
}

// След скина при беге и прыжках
function skinTrail(p, dt) {
  const skin = currentSkin();
  if (!skin.trail || p.dead) return;
  const moving = Math.abs(p.vx) > 40 || !p.onGround;
  if (!moving || Math.random() > dt * 30) return;
  const x = p.x + p.w / 2 - p.face * 8, y = p.y + p.h - 6;
  const t = performance.now() / 1000;
  switch (skin.trail) {
    case 'fire': emit(x, y, 1, { color: ['#ffd54a', '#ff7a3d', '#ff3d3d'], angle: -Math.PI / 2, spread: 0.5, speed: 70, grav: -150, life: 0.45, size: 5 }); break;
    case 'sparkle': emit(x, y - 8, 1, { color: ['#ffffff', '#fff6c2'], speed: 30, grav: 0, life: 0.6, size: 3 }); break;
    case 'gold': emit(x, y, 1, { color: ['#ffd700', '#fff2a8'], speed: 50, grav: 200, life: 0.5, size: 3 }); break;
    case 'rainbow': emit(x, y - 6, 1, { color: `hsl(${(t * 200) % 360}, 90%, 65%)`, speed: 20, grav: 0, life: 0.5, size: 5 }); break;
    case 'smoke': emit(x, y, 1, { color: 'rgba(120,120,140,0.6)', angle: -Math.PI / 2, spread: 0.6, speed: 40, grav: -40, life: 0.6, size: 6 }); break;
    case 'ghost': emit(x, y - 10, 1, { color: 'rgba(220,235,255,0.5)', speed: 15, grav: -30, life: 0.7, size: 6 }); break;
    case 'notes': if (Math.random() < 0.3) emit(x, y - 20, 1, { color: ['#56e39f', '#ff7ac8', '#6fd3ff'], angle: -Math.PI / 2, spread: 0.8, speed: 50, grav: -20, life: 0.8, size: 5 }); break;
  }
}

function drawAccessory(c, skin, t) {
  switch (skin.acc) {
    case 'hat':
      c.fillStyle = '#6b3d1a';
      c.beginPath(); c.ellipse(0, -27, 17, 4, 0, 0, Math.PI * 2); c.fill();
      roundRect(c, -8, -38, 16, 12, 4); c.fill();
      c.fillStyle = '#ffd54a'; c.fillRect(-8, -30, 16, 2);
      break;
    case 'crown':
      c.fillStyle = '#ffd54a';
      c.beginPath();
      c.moveTo(-9, -26); c.lineTo(-9, -35); c.lineTo(-4.5, -30); c.lineTo(0, -38); c.lineTo(4.5, -30); c.lineTo(9, -35); c.lineTo(9, -26);
      c.closePath(); c.fill();
      c.fillStyle = '#ff3d7f'; c.beginPath(); c.arc(0, -29, 2, 0, Math.PI * 2); c.fill();
      break;
    case 'horns':
      c.fillStyle = '#7a1010';
      c.beginPath(); c.moveTo(-9, -25); c.quadraticCurveTo(-14, -34, -8, -38); c.lineTo(-5, -26); c.fill();
      c.beginPath(); c.moveTo(9, -25); c.quadraticCurveTo(14, -34, 8, -38); c.lineTo(5, -26); c.fill();
      break;
    case 'halo':
      c.strokeStyle = '#ffd54a'; c.lineWidth = 2.5;
      c.beginPath(); c.ellipse(0, -36 + Math.sin(t * 3) * 1.5, 9, 3, 0, 0, Math.PI * 2); c.stroke();
      break;
    case 'bow':
      c.fillStyle = '#ff3d8f';
      c.beginPath(); c.moveTo(-6, -27); c.lineTo(-13, -32); c.lineTo(-13, -22); c.fill();
      c.beginPath(); c.moveTo(-6, -27); c.lineTo(1, -32); c.lineTo(1, -22); c.fill();
      c.beginPath(); c.arc(-6, -27, 2.5, 0, Math.PI * 2); c.fill();
      break;
    case 'band':
      c.fillStyle = '#e02b3a'; c.fillRect(-11, -26, 22, 3);
      c.beginPath(); c.moveTo(-11, -25); c.lineTo(-19, -27 + Math.sin(t * 12) * 3); c.lineTo(-18, -22 + Math.sin(t * 12 + 1) * 3); c.fill();
      break;
    case 'phones':
      c.strokeStyle = '#2b2f40'; c.lineWidth = 3;
      c.beginPath(); c.arc(0, -24, 12, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
      c.fillStyle = '#ff7ac8';
      roundRect(c, -14, -25, 5, 9, 2); c.fill();
      roundRect(c, 9, -25, 5, 9, 2); c.fill();
      break;
  }
}

// Робот. Можно рисовать в любой контекст (превью в магазине)
function drawRobot(p, x, y, alpha = 1, ghost = false, g = ctx, skin = currentSkin()) {
  const c = g;
  const t = performance.now() / 1000;
  c.save();
  c.globalAlpha = alpha * (skin.alpha || 1);
  c.translate(x + p.w / 2, y + p.h);
  // дыхание в покое
  const breath = p.idleT > 0.3 ? 1 + Math.sin(t * (p.idleT > 4 ? 2 : 4)) * 0.035 : 1;
  c.scale(p.sx * p.face, p.sy * breath);
  const body = ghost ? skin.dark : skinBody(skin, t), dark = ghost ? body : skin.dark;
  const moving = p.onGround && Math.abs(p.vx) > 20;
  const sw = moving ? Math.sin(p.runPhase) : 0;
  const air = !p.onGround;

  if (skin.glow && !ghost) {
    const gr = c.createRadialGradient(0, -17, 2, 0, -17, 26);
    gr.addColorStop(0, skin.glow + 'aa'); gr.addColorStop(1, skin.glow + '00');
    c.fillStyle = gr;
    c.beginPath(); c.arc(0, -17, 26, 0, Math.PI * 2); c.fill();
  }
  // ноги
  c.fillStyle = dark;
  if (air) { c.fillRect(-8, -7, 5, 6); c.fillRect(3, -9, 5, 6); }
  else { c.fillRect(-8 + sw * 3, -7, 5, 7); c.fillRect(3 - sw * 3, -7, 5, 7); }
  // руки
  c.fillRect(-14, air ? -24 : -18 + sw * 2, 4, 8);
  c.fillRect(10, air ? -24 : -18 - sw * 2, 4, 8);
  // тело
  c.fillStyle = body;
  roundRect(c, -11, -27, 22, 21, 6); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.35)';
  roundRect(c, -9, -26, 12, 4, 2); c.fill();
  // визор
  c.fillStyle = '#16203f';
  roundRect(c, -6, -23, 16, 10, 4); c.fill();
  if (!ghost) {
    const blink = p.blinkT < 0 || p.idleT > 4;
    c.fillStyle = p.dead ? '#ff5d73' : skin.eye;
    if (blink) { c.fillRect(-2, -18, 4, 1.5); c.fillRect(4, -18, 4, 1.5); }
    else { c.fillRect(-2, -21, 4, 6); c.fillRect(4, -21, 4, 6); }
    c.fillStyle = dark; c.fillRect(-6, -11, 10, 3);
  }
  // антенна (жёлтая, когда рывок готов)
  c.strokeStyle = dark; c.lineWidth = 2;
  c.beginPath(); c.moveTo(0, -27); c.lineTo(-2, -33); c.stroke();
  const ready = p.canDash && p.dashCD <= 0;
  c.fillStyle = ready ? '#ffd54a' : '#5a6380';
  if (ready && !ghost) {
    c.save(); c.globalAlpha = alpha * 0.35;
    c.beginPath(); c.arc(-2, -35, 6, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  c.beginPath(); c.arc(-2, -35, 3, 0, Math.PI * 2); c.fill();
  if (!ghost) drawAccessory(c, skin, t);
  c.restore();
}

// Поза для превью
function previewPose(t, running = true) {
  return {
    w: 22, h: 28, face: 1, sx: 1, sy: 1, vx: running ? 200 : 0, onGround: true,
    runPhase: t * 14, blinkT: (t % 3) < 0.12 ? -1 : 1, canDash: true, dashCD: 0, dead: false,
  };
}
