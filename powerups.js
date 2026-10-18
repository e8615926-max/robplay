'use strict';

// ============================================================
//  Бонусы: щит, магнит, звезда
// ============================================================
const POWERUPS = {
  '!': { kind: 'shield', color: '#6fd3ff', icon: 'shield' },
  '&': { kind: 'magnet', color: '#ff5d73', icon: 'magnet', time: 12 },
  '*': { kind: 'star', color: '#ffd54a', icon: 'star', time: 8 },
};

function makePowerup(c, px, py) {
  return { c, ...POWERUPS[c], x: px + 4, y: py + 4, w: 24, h: 24, taken: false, phase: Math.random() * 6 };
}

function updatePowerups(L, p, dt) {
  for (const u of L.powerups) {
    if (u.taken || p.dead || !overlap(p, u)) continue;
    u.taken = true;
    if (u.kind === 'shield') p.shield = true;
    if (u.kind === 'magnet') p.magnet = u.time;
    if (u.kind === 'star') p.star = u.time;
    Sound.play('powerup');
    emit(u.x + 12, u.y + 12, 24, { color: [u.color, '#ffffff'], speed: 260, grav: 0, life: 0.6 });
    ring(u.x + 12, u.y + 12, u.color);
    const [nm, hint] = T('powerups')[u.kind];
    floatText(u.x + 12, u.y - 6, `${nm}: ${hint}`, u.color);
  }
  if (p.dead) return;
  if (p.magnet > 0) p.magnet -= dt;
  // магнит: бонус или пассивное улучшение
  const rad = p.magnet > 0 ? 170 : (pasLv('magnet') ? 30 + 40 * pasLv('magnet') : 0);
  if (rad) {
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    for (const c of L.coins) {
      if (c.taken) continue;
      const dx = cx - (c.x + 8), dy = cy - (c.y + 8), d = Math.hypot(dx, dy);
      if (d < rad && d > 1) { c.x += dx / d * 420 * dt; c.y += dy / d * 420 * dt; }
    }
  }
  if (p.star > 0) {
    p.star -= dt;
    if (Math.random() < dt * 40) {
      emit(p.x + rand(0, p.w), p.y + rand(0, p.h), 1, { color: `hsl(${rand(0, 360)}, 90%, 65%)`, speed: 40, grav: 0, life: 0.5, size: 4 });
    }
    if (p.star <= 0) Sound.play('powerdown');
  }
}

function drawPowerups(L, t) {
  for (const u of L.powerups) {
    if (u.taken) continue;
    const cx = u.x + 12, cy = u.y + 12 + Math.sin(t * 3 + u.phase) * 4;
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22);
    g.addColorStop(0, u.color + 'aa'); g.addColorStop(1, u.color + '00');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();
    drawIcon(ctx, u.icon, cx, cy, 16);
    // блик, бегающий по кругу
    const a = t * 3 + u.phase;
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx + Math.cos(a) * 13 - 1.5, cy + Math.sin(a) * 13 - 1.5, 3, 3);
  }
}

// Эффекты бонусов вокруг робота
function drawPlayerPowers(p, t) {
  if (p.dead) return;
  const cx = p.x + p.w / 2, cy = p.y + p.h / 2 - 4;
  if (p.shield) {
    ctx.strokeStyle = `rgba(111,211,255,${0.55 + Math.sin(t * 6) * 0.2})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(111,211,255,0.12)';
    ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.ellipse(cx - 9, cy - 12, 5, 3, -0.6, 0, Math.PI * 2); ctx.fill();
  }
  if (p.magnet > 0) {
    ctx.strokeStyle = `rgba(255,93,115,${0.3 + 0.2 * Math.sin(t * 8)})`;
    ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      const r = ((t * 60 + k * 30) % 90) + 20;
      ctx.globalAlpha = 1 - r / 110;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  if (p.star > 0 && (p.star > 2 || Math.sin(t * 20) > 0)) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `hsla(${(t * 400) % 360}, 90%, 60%, 0.35)`;
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function powerHud(p) {
  const parts = [];
  if (p && !p.dead) {
    if (p.shield) parts.push(ico('shield'));
    if (p.magnet > 0) parts.push(`${ico('magnet')}${Math.ceil(p.magnet)}`);
    if (p.star > 0) parts.push(`${ico('star')}${Math.ceil(p.star)}`);
  }
  return parts.join('  ');
}

// Расходящееся кольцо — для монет, бонусов, чекпоинтов
function ring(x, y, color = '#ffffff', r = 30) {
  Game.rings.push({ x, y, color, life: 0.4, max: 0.4, r });
}
function updateRings(dt) {
  for (let i = Game.rings.length - 1; i >= 0; i--) {
    Game.rings[i].life -= dt;
    if (Game.rings[i].life <= 0) Game.rings.splice(i, 1);
  }
}
function drawRings() {
  for (const g of Game.rings) {
    const k = 1 - g.life / g.max;
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = g.color; ctx.lineWidth = 3 * (1 - k) + 1;
    ctx.beginPath(); ctx.arc(g.x, g.y, 4 + k * g.r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
