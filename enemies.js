'use strict';

// ============================================================
//  Враги и снаряды
// ============================================================

// stomp — можно растоптать сверху, dash — пробивается рывком,
// safeTop — на него можно прыгать без вреда (но он не погибает)
const ENEMY_INFO = {
  walker:  { stomp: true,  dash: true,  color: '#ff5d73' },
  spiker:  { stomp: false, dash: true,  color: '#4f7a5a' },
  jumper:  { stomp: true,  dash: true,  color: '#5fd068' },
  charger: { stomp: true,  dash: true,  color: '#a0663a' },
  turret:  { stomp: true,  dash: true,  color: '#6b7390' },
  flyer:   { stomp: true,  dash: true,  color: '#7b4dff' },
  swooper: { stomp: true,  dash: true,  color: '#4a2f6b' },
  ghost:   { stomp: false, dash: true,  color: '#e8f0ff' },
  saw:     { stomp: false, dash: false, color: '#c9d1e0' },
  dropper: { stomp: false, dash: false, safeTop: true, color: '#7c8296' },
};

function makeEnemy(c, px, py) {
  const base = { alive: true, deadT: 0, t: Math.random() * 6, vx: 0, vy: 0, face: -1, state: '', timer: 0 };
  switch (c) {
    case 'E': return { ...base, type: 'walker', x: px + 3, y: py + TILE - 22, w: 26, h: 22, vx: -70 };
    case 'S': return { ...base, type: 'spiker', x: px + 3, y: py + TILE - 22, w: 26, h: 22, vx: -50 };
    case 'J': return { ...base, type: 'jumper', x: px + 4, y: py + TILE - 20, w: 24, h: 20, timer: rand(0.6, 1.6) };
    case 'H': return { ...base, type: 'charger', x: px, y: py + TILE - 26, w: 32, h: 26, vx: -40, state: 'walk' };
    case 'T': return { ...base, type: 'turret', x: px + 2, y: py + TILE - 26, w: 28, h: 26, timer: rand(1, 2) };
    case 'F': return { ...base, type: 'flyer', x0: px + 3, y0: py + 6, x: px + 3, y: py + 6, w: 26, h: 20 };
    case 'W': return { ...base, type: 'swooper', x0: px + 4, y0: py + 2, x: px + 4, y: py + 2, w: 24, h: 18, state: 'hang' };
    case 'Q': return { ...base, type: 'ghost', x: px + 2, y: py + 2, w: 28, h: 28 };
    case 'O': return { ...base, type: 'saw', cx: px + 16, cy: py + 16, x: px + 2, y: py + 2, w: 28, h: 28 };
    case 'D': return { ...base, type: 'dropper', x0: px + 1, y0: py, x: px + 1, y: py, w: 30, h: 30, state: 'idle' };
  }
  return null;
}

// Ходьба по земле: гравитация, разворот у стен, шипов и обрывов
function groundMove(L, e, dt, edgeTurn = true) {
  e.vy = Math.min(e.vy + GRAVITY * dt, MAX_FALL);
  let turned = false;
  if (e.vx) {
    e.x += e.vx * dt;
    const front = e.vx > 0 ? e.x + e.w + 1 : e.x - 1;
    const ftx = Math.floor(front / TILE);
    const footY = Math.floor((e.y + e.h + 4) / TILE);
    const midY = Math.floor((e.y + e.h / 2) / TILE);
    const groundAhead = L.solid(ftx, footY) || L.tile(ftx, footY) === '=';
    if (L.solid(ftx, midY) || L.tile(ftx, midY) === '^' || (edgeTurn && e.grounded && !groundAhead)) {
      e.vx = -e.vx;
      e.x += e.vx * dt * 2;
      turned = true;
    }
    e.face = e.vx > 0 ? 1 : -1;
  }
  e.y += e.vy * dt;
  e.grounded = false;
  if (e.vy >= 0) {
    const ty = Math.floor((e.y + e.h) / TILE);
    for (const cx of [e.x + 3, e.x + e.w / 2, e.x + e.w - 3]) {
      const tx = Math.floor(cx / TILE);
      if (L.solid(tx, ty) || L.tile(tx, ty) === '=') { e.y = ty * TILE - e.h; e.vy = 0; e.grounded = true; break; }
    }
  } else {
    const ty = Math.floor(e.y / TILE);
    if (L.solid(Math.floor((e.x + e.w / 2) / TILE), ty)) { e.y = (ty + 1) * TILE; e.vy = 0; }
  }
  if (e.y > L.h + 64) e.alive = false;
  return turned;
}

function onScreen(x, y) {
  return x > Game.cam.x - 64 && x < Game.cam.x + viewW + 64 && y > Game.cam.y - 64 && y < Game.cam.y + viewH + 64;
}

function updateEnemies(L, p, dt) {
  const pcx = p.x + p.w / 2, pcy = p.y + p.h / 2;
  for (const e of L.enemies) {
    e.t += dt;
    if (!e.alive) { e.deadT -= dt; continue; }
    const dx = pcx - (e.x + e.w / 2), dy = pcy - (e.y + e.h / 2);
    const near = !p.dead && Math.abs(dx) < 14 * TILE && Math.abs(dy) < 8 * TILE;

    switch (e.type) {
      case 'walker':
      case 'spiker':
        groundMove(L, e, dt);
        break;

      case 'jumper':
        groundMove(L, e, dt, false);
        if (e.grounded) {
          e.vx = 0;
          e.timer -= dt;
          if (e.timer <= 0 && near) {
            e.face = dx > 0 ? 1 : -1;
            // не прыгаем в пропасть
            const landX = Math.floor((e.x + e.w / 2 + e.face * 130) / TILE);
            const footY = Math.floor((e.y + e.h + 4) / TILE);
            e.vx = L.solid(landX, footY) ? e.face * 150 : 0;
            e.vy = -620;
            e.grounded = false;
            e.timer = rand(1, 1.6);
          }
        }
        break;

      case 'charger':
        if (e.state === 'wind') {
          groundMove(L, e, dt);
          e.timer -= dt;
          if (e.timer <= 0) { e.state = 'charge'; e.vx = e.face * 330; }
        } else if (e.state === 'charge') {
          if (groundMove(L, e, dt)) {
            e.vx = 0; e.state = 'stun'; e.timer = 0.9;
            if (onScreen(e.x, e.y)) { Game.shake = Math.max(Game.shake, 4); Sound.play('thud'); }
          }
          if (Math.random() < 0.4) emit(e.x + e.w / 2 - e.face * 14, e.y + e.h, 1, { color: '#c8a27a', speed: 60, grav: 100, life: 0.4 });
        } else if (e.state === 'stun') {
          groundMove(L, e, dt);
          e.timer -= dt;
          if (e.timer <= 0) { e.state = 'walk'; e.vx = e.face * 40; }
        } else {
          if (!e.vx) e.vx = e.face * 40;
          groundMove(L, e, dt);
          if (!p.dead && Math.abs(dx) < 7 * TILE && Math.abs(dy) < 40 && Math.sign(dx) === e.face) {
            e.state = 'wind'; e.timer = 0.45; e.vx = 0;
          }
        }
        break;

      case 'turret':
        if (near) e.face = dx > 0 ? 1 : -1;
        e.timer -= dt;
        if (e.timer <= 0) {
          e.timer = 2.2;
          if (near && Math.abs(dx) < 13 * TILE && Math.abs(dy) < 3 * TILE) {
            L.bullets.push({ kind: 'ball', x: e.x + e.w / 2 + e.face * 18, y: e.y + 9, vx: e.face * 230, vy: 0, r: 6, life: 4 });
            Sound.play('shoot');
          }
        }
        break;

      case 'flyer':
        e.x = e.x0 + Math.sin(e.t * 0.9) * 64;
        e.y = e.y0 + Math.sin(e.t * 2.4) * 18;
        e.face = Math.cos(e.t * 0.9) > 0 ? 1 : -1;
        break;

      case 'swooper':
        if (e.state === 'swoop') {
          e.x += e.vx * dt; e.y += e.vy * dt;
          e.vy -= 300 * dt;
          e.timer -= dt;
          if (e.timer <= 0) e.state = 'return';
        } else if (e.state === 'return') {
          const rx = e.x0 - e.x, ry = e.y0 - e.y, d = Math.hypot(rx, ry);
          if (d < 4) { e.x = e.x0; e.y = e.y0; e.state = 'hang'; e.timer = 1.2; }
          else { e.x += rx / d * 150 * dt; e.y += ry / d * 150 * dt; e.face = rx > 0 ? 1 : -1; }
        } else {
          e.timer -= dt;
          e.y = e.y0 + Math.sin(e.t * 3) * 3;
          if (e.timer <= 0 && !p.dead && Math.abs(dx) < 4.5 * TILE && dy > 0 && dy < 9 * TILE) {
            const d = Math.hypot(dx, dy);
            e.vx = dx / d * 300; e.vy = dy / d * 300 + 60;
            e.state = 'swoop'; e.timer = 1.3; e.face = dx > 0 ? 1 : -1;
            if (onScreen(e.x, e.y)) Sound.play('swoop');
          }
        }
        break;

      case 'ghost': {
        // призрак двигается, только когда робот стоит к нему спиной
        const behind = (p.face > 0 && dx > 0) || (p.face < 0 && dx < 0);
        e.shy = !behind;
        if (behind && !p.dead && Math.abs(dx) < 12 * TILE && Math.abs(dy) < 8 * TILE) {
          const d = Math.hypot(dx, dy) || 1;
          e.x += dx / d * 62 * dt; e.y += dy / d * 62 * dt;
          e.face = dx > 0 ? 1 : -1;
        }
        break;
      }

      case 'saw': {
        const a = e.t * 2.2;
        e.x = e.cx + Math.cos(a) * 48 - e.w / 2;
        e.y = e.cy + Math.sin(a) * 48 - e.h / 2;
        break;
      }

      case 'dropper':
        if (e.state === 'shake') {
          e.timer -= dt;
          if (e.timer <= 0) { e.state = 'fall'; e.vy = 0; }
        } else if (e.state === 'fall') {
          e.vy = Math.min(e.vy + GRAVITY * 1.4 * dt, 1100);
          e.y += e.vy * dt;
          const ty = Math.floor((e.y + e.h) / TILE);
          if (L.solid(Math.floor((e.x + 4) / TILE), ty) || L.solid(Math.floor((e.x + e.w - 4) / TILE), ty)) {
            e.y = ty * TILE - e.h; e.state = 'rest'; e.timer = 1;
            if (onScreen(e.x, e.y)) {
              Game.shake = Math.max(Game.shake, 6); Sound.play('thud');
              emit(e.x + e.w / 2, e.y + e.h, 10, { color: '#bfb6a6', angle: -Math.PI / 2, spread: 1.5, speed: 160, life: 0.5 });
            }
          } else if (e.y > L.h) { e.y = e.y0; e.state = 'idle'; }
        } else if (e.state === 'rest') {
          e.timer -= dt;
          if (e.timer <= 0) e.state = 'rise';
        } else if (e.state === 'rise') {
          e.y -= 90 * dt;
          if (e.y <= e.y0) { e.y = e.y0; e.state = 'idle'; e.timer = 0.5; }
        } else {
          e.timer -= dt;
          if (e.timer <= 0 && !p.dead && Math.abs(dx) < 44 && dy > 0) { e.state = 'shake'; e.timer = 0.3; }
        }
        break;
    }
  }
}

function killEnemy(e, p, stomped) {
  e.alive = false;
  e.deadT = 0.6;
  emit(e.x + e.w / 2, e.y + e.h / 2, 18, { color: [ENEMY_INFO[e.type].color, '#ffffff', '#333344'], speed: 260, life: 0.6 });
  Game.shake = Math.max(Game.shake, 6);
  Sound.play('stomp');
  if (stomped) {
    p.vy = Input.is('jump') ? -STOMP_V * 1.25 : -STOMP_V;
    p.bounced = true; p.jumps = 1; p.canDash = true; p.sx = 0.8; p.sy = 1.2;
  }
}

// Столкновения робота с врагами. Возвращает true, если робот погиб.
function enemyContact(L, p, dt) {
  for (const e of L.enemies) {
    if (!e.alive) continue;
    const info = ENEMY_INFO[e.type];
    const eb = e.type === 'saw'
      ? { x: e.x + 4, y: e.y + 4, w: e.w - 8, h: e.h - 8 }
      : { x: e.x + 2, y: e.y + 2, w: e.w - 4, h: e.h - 2 };
    if (!overlap(p, eb)) continue;
    const fromAbove = p.vy > 0 && (p.y + p.h) - p.vy * dt <= e.y + 10;
    if (p.dashT > 0 && info.dash) {
      killEnemy(e, p, false);
    } else if (fromAbove && info.stomp) {
      killEnemy(e, p, true);
    } else if (info.safeTop) {
      // давилка опасна только снизу и в падении
      if (e.state === 'fall' || p.y > e.y + e.h - 10) { if (p.spawnT <= 0) { killPlayer(); return true; } }
      else if (fromAbove || p.y + p.h <= e.y + 10) {
        p.y = e.y - p.h; p.vy = -STOMP_V * 0.7; p.bounced = true; p.jumps = 1; p.canDash = true;
      }
    } else if (p.spawnT <= 0) {
      killPlayer();
      return true;
    }
  }
  return false;
}

// ---------- Снаряды ----------
function updateBullets(L, p, dt) {
  for (let i = L.bullets.length - 1; i >= 0; i--) {
    const b = L.bullets[i];
    b.life -= dt;
    if (b.grav) b.vy += b.grav * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    let dead = b.life <= 0 || b.y > L.h + 100;
    if (b.kind === 'wave') {
      const tx = Math.floor((b.x + (b.vx > 0 ? b.w : 0)) / TILE), ty = Math.floor((b.y + b.h - 2) / TILE);
      if (L.solid(tx, ty) || !L.solid(tx, ty + 1)) dead = true;
      if (!dead && !p.dead && p.spawnT <= 0 && overlap(p, { x: b.x + 3, y: b.y + 6, w: b.w - 6, h: b.h - 6 })) killPlayer();
    } else {
      if (b.y > 0 && L.solid(Math.floor(b.x / TILE), Math.floor(b.y / TILE))) dead = true;
      if (!dead && !p.dead && p.spawnT <= 0) {
        const cx = clamp(b.x, p.x + 2, p.x + p.w - 2), cy = clamp(b.y, p.y + 2, p.y + p.h);
        if ((b.x - cx) ** 2 + (b.y - cy) ** 2 < b.r * b.r) { killPlayer(); dead = true; }
      }
    }
    if (dead) {
      if (b.kind === 'bomb') {
        emit(b.x, b.y, 16, { color: ['#ffd54a', '#ff7a3d', '#555'], speed: 240, life: 0.5 });
        if (onScreen(b.x, b.y)) Sound.play('boom');
      } else if (b.kind !== 'wave') {
        emit(b.x, b.y, 6, { color: b.kind === 'orb' ? '#d68cff' : '#ffb347', speed: 120, life: 0.35 });
      }
      L.bullets.splice(i, 1);
    }
  }
}

function drawBullets(L, t) {
  for (const b of L.bullets) {
    if (b.kind === 'wave') {
      const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
      g.addColorStop(0, 'rgba(255,240,150,0)');
      g.addColorStop(1, 'rgba(255,200,80,0.95)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + b.h);
      ctx.quadraticCurveTo(b.x + b.w / 2, b.y - 6 + Math.sin(t * 30) * 3, b.x + b.w, b.y + b.h);
      ctx.fill();
      continue;
    }
    const col = b.kind === 'orb' ? '#c06bff' : b.kind === 'bomb' ? '#2a2a3a' : '#ff8a3d';
    ctx.fillStyle = b.kind === 'orb' ? 'rgba(192,107,255,0.3)' : b.kind === 'bomb' ? 'rgba(255,90,60,0.25)' : 'rgba(255,170,60,0.3)';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.35, 0, Math.PI * 2); ctx.fill();
    if (b.kind === 'bomb') {
      ctx.fillStyle = Math.sin(t * 40) > 0 ? '#ffd54a' : '#ff5d3d';
      ctx.fillRect(b.x - 1.5, b.y - b.r - 5, 3, 4);
    }
  }
}

// ---------- Отрисовка врагов ----------
function drawEnemy(e, t) {
  const face = e.face || -1;
  ctx.save();
  ctx.translate(e.x + e.w / 2, e.y + e.h);
  switch (e.type) {
    case 'walker':
    case 'spiker': {
      const step = Math.sin(e.t * 12);
      const spk = e.type === 'spiker';
      const body = spk ? '#4f7a5a' : '#ff5d73', dark = spk ? '#2c4a33' : '#7a1f33';
      if (spk) {
        ctx.fillStyle = '#dfe6e9';
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath(); ctx.moveTo(i * 5 - 4, -16); ctx.lineTo(i * 5, -30 + Math.abs(i) * 3); ctx.lineTo(i * 5 + 4, -16); ctx.fill();
        }
      }
      ctx.fillStyle = dark;
      ctx.fillRect(-10 + step * 2, -4, 7, 4); ctx.fillRect(3 - step * 2, -4, 7, 4);
      ctx.fillStyle = body;
      roundRect(ctx, -13, -22, 26, 19, 9); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; roundRect(ctx, -10, -21, 20, 5, 3); ctx.fill();
      if (!spk) {
        ctx.fillStyle = dark;
        ctx.beginPath(); ctx.moveTo(-10, -20); ctx.lineTo(-7, -27); ctx.lineTo(-4, -21); ctx.fill();
        ctx.beginPath(); ctx.moveTo(10, -20); ctx.lineTo(7, -27); ctx.lineTo(4, -21); ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.fillRect(-7 + face * 3, -16, 5, 6); ctx.fillRect(2 + face * 3, -16, 5, 6);
      ctx.fillStyle = '#1b1b2a';
      ctx.fillRect(-5 + face * 4, -14, 2, 3); ctx.fillRect(4 + face * 4, -14, 2, 3);
      ctx.fillStyle = dark;
      ctx.fillRect(-8 + face * 3, -18, 6, 2); ctx.fillRect(2 + face * 3, -18, 6, 2);
      break;
    }
    case 'jumper': {
      const crouch = e.grounded && e.timer < 0.3 ? 0.75 : 1;
      const stretch = !e.grounded ? 1.15 : 1;
      ctx.scale(face * (2 - crouch * stretch), crouch * stretch);
      ctx.fillStyle = '#3c9a46';
      ctx.fillRect(-12, -5, 8, 5); ctx.fillRect(4, -5, 8, 5);
      ctx.fillStyle = '#5fd068';
      ctx.beginPath(); ctx.ellipse(0, -9, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c8f5b0';
      ctx.beginPath(); ctx.ellipse(2, -6, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5fd068';
      ctx.beginPath(); ctx.arc(-4, -17, 5, 0, Math.PI * 2); ctx.arc(6, -17, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-3, -18, 3, 0, Math.PI * 2); ctx.arc(7, -18, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.fillRect(-2, -19, 2, 2); ctx.fillRect(8, -19, 2, 2);
      break;
    }
    case 'charger': {
      ctx.scale(face, 1);
      const angry = e.state === 'wind' || e.state === 'charge';
      const shake = e.state === 'wind' ? rand(-1.5, 1.5) : 0;
      ctx.translate(shake, 0);
      const step = e.state === 'charge' ? Math.sin(e.t * 30) * 3 : Math.sin(e.t * 8) * 2;
      ctx.fillStyle = '#5c3a1e';
      ctx.fillRect(-12 + step, -6, 6, 6); ctx.fillRect(6 - step, -6, 6, 6);
      ctx.fillStyle = '#a0663a';
      roundRect(ctx, -16, -24, 30, 19, 8); ctx.fill();
      ctx.fillStyle = '#7a4a26';
      roundRect(ctx, 6, -22, 12, 14, 5); ctx.fill();
      ctx.fillStyle = '#f2e6c9';
      ctx.beginPath(); ctx.moveTo(10, -20); ctx.lineTo(20, -30); ctx.lineTo(14, -18); ctx.fill();
      ctx.fillStyle = angry ? '#ff3b3b' : '#fff';
      ctx.fillRect(11, -18, 4, 4);
      if (e.state === 'stun') {
        ctx.fillStyle = '#ffd54a';
        for (let i = 0; i < 3; i++) { const a = e.t * 6 + i * 2.1; ctx.fillRect(Math.cos(a) * 12 - 2, -32 + Math.sin(a) * 4, 4, 4); }
      }
      break;
    }
    case 'turret': {
      ctx.fillStyle = '#4a5068';
      roundRect(ctx, -14, -16, 28, 16, 4); ctx.fill();
      ctx.fillStyle = '#6b7390';
      ctx.beginPath(); ctx.arc(0, -16, 10, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#2b2f40';
      ctx.fillRect(face > 0 ? 4 : -18, -21, 14, 7);
      const charge = e.timer < 0.45;
      ctx.fillStyle = charge ? (Math.sin(t * 40) > 0 ? '#ff5d3d' : '#ffd54a') : '#8ff7ff';
      ctx.beginPath(); ctx.arc(0, -16, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd54a'; ctx.fillRect(-12, -6, 24, 2);
      break;
    }
    case 'flyer': {
      const flap = Math.sin(e.t * 20);
      ctx.fillStyle = '#b48cff';
      ctx.beginPath(); ctx.ellipse(-12, -14 - flap * 4, 9, 4, -0.4 - flap * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(12, -14 - flap * 4, 9, 4, 0.4 + flap * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7b4dff';
      ctx.beginPath(); ctx.arc(0, -10, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(face * 3, -11, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff3d5a';
      ctx.beginPath(); ctx.arc(face * 4, -11, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a2aa8';
      ctx.beginPath(); ctx.moveTo(-3, -1); ctx.lineTo(0, 4); ctx.lineTo(3, -1); ctx.fill();
      break;
    }
    case 'swooper': {
      const hang = e.state === 'hang';
      const flap = hang ? 0.2 : Math.sin(e.t * 24);
      ctx.fillStyle = '#2d1b45';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(s * 16, -16 + flap * 6);
        ctx.lineTo(s * 12, -8 + flap * 3);
        ctx.lineTo(s * 7, -10);
        ctx.fill();
      }
      ctx.fillStyle = '#4a2f6b';
      ctx.beginPath(); ctx.ellipse(0, -9, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-6, -15); ctx.lineTo(-4, -21); ctx.lineTo(-1, -15); ctx.fill();
      ctx.beginPath(); ctx.moveTo(6, -15); ctx.lineTo(4, -21); ctx.lineTo(1, -15); ctx.fill();
      ctx.fillStyle = '#ffde3b';
      ctx.fillRect(-4, -12, 3, 3); ctx.fillRect(1, -12, 3, 3);
      break;
    }
    case 'ghost': {
      const bob = Math.sin(e.t * 2) * 3;
      ctx.translate(0, bob);
      ctx.globalAlpha = e.shy ? 0.55 : 0.85;
      ctx.fillStyle = '#e8f0ff';
      ctx.beginPath();
      ctx.arc(0, -16, 13, Math.PI, 0);
      ctx.lineTo(13, -2);
      for (let i = 0; i < 4; i++) ctx.lineTo(13 - (i + 0.5) * 6.5, -2 + (i % 2 ? 4 : -2) + Math.sin(e.t * 6 + i) * 1.5);
      ctx.lineTo(-13, -2);
      ctx.closePath();
      ctx.fill();
      if (e.shy) {
        ctx.fillStyle = '#c7d3ef';
        ctx.fillRect(-11, -20, 9, 6); ctx.fillRect(2, -20, 9, 6);
        ctx.fillStyle = '#ff9fb8'; ctx.fillRect(-9, -11, 4, 2); ctx.fillRect(5, -11, 4, 2);
      } else {
        ctx.fillStyle = '#1b1b2a';
        ctx.beginPath(); ctx.ellipse(-5 + face * 2, -18, 3, 4, 0, 0, Math.PI * 2); ctx.ellipse(5 + face * 2, -18, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(face * 2, -9, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'saw': {
      ctx.restore();
      // направляющая окружность
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2; ctx.setLineDash([3, 6]);
      ctx.beginPath(); ctx.arc(e.cx, e.cy, 48, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.save();
      ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
      ctx.rotate(e.t * 14);
      ctx.fillStyle = '#c9d1e0';
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const r = i % 2 ? 10 : 15, a = i * Math.PI / 8;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7d8599';
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'dropper': {
      ctx.restore();
      ctx.save();
      // цепь
      ctx.strokeStyle = 'rgba(160,160,180,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(e.x0 + e.w / 2, e.y0 - 200); ctx.lineTo(e.x + e.w / 2, e.y); ctx.stroke();
      const sh = e.state === 'shake' ? rand(-2, 2) : 0;
      ctx.translate(e.x + sh, e.y);
      ctx.fillStyle = '#7c8296'; roundRect(ctx, 0, 0, e.w, e.h, 4); ctx.fill();
      ctx.fillStyle = '#9aa0b4'; ctx.fillRect(2, 2, e.w - 4, 5);
      ctx.fillStyle = '#d4d8e4';
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(i * 7.5 + 1, e.h); ctx.lineTo(i * 7.5 + 4.5, e.h + 6); ctx.lineTo(i * 7.5 + 8, e.h); ctx.fill(); }
      const angry = e.state === 'shake' || e.state === 'fall';
      ctx.fillStyle = angry ? '#ff3b3b' : '#2b2f40';
      ctx.fillRect(7, 12, 5, angry ? 5 : 3); ctx.fillRect(18, 12, 5, angry ? 5 : 3);
      ctx.fillStyle = '#2b2f40';
      ctx.fillRect(6, angry ? 9 : 10, 7, 2); ctx.fillRect(17, angry ? 9 : 10, 7, 2);
      ctx.fillRect(9, 21, 12, 2);
      break;
    }
  }
  ctx.restore();
}

function drawEnemies(L, t) {
  for (const e of L.enemies) {
    if (!e.alive) {
      if (e.deadT <= 0) continue;
      ctx.globalAlpha = Math.max(0, e.deadT / 0.6);
      ctx.fillStyle = ENEMY_INFO[e.type].color;
      roundRect(ctx, e.x, e.y + e.h - 6, e.w, 6, 3); ctx.fill();
      ctx.globalAlpha = 1;
      continue;
    }
    if (!onScreen(e.x, e.y) && e.type !== 'dropper') continue;
    drawEnemy(e, t);
  }
}
