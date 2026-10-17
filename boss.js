'use strict';

// ============================================================
//  Боссы (каждый 10-й уровень)
// ============================================================
const BOSS_INFO = {
  1: { name: 'Громобот', hp: 6, w: 64, h: 60 },
  2: { name: 'Буревестник', hp: 6, w: 88, h: 52 },
  3: { name: 'Ядро Хаоса', hp: 8, w: 64, h: 64 },
};

function makeBoss(kind, px, py) {
  const info = BOSS_INFO[kind];
  const y = py + TILE - info.h;
  return {
    kind, name: info.name, hp: info.hp, maxHp: info.hp, w: info.w, h: info.h,
    x: px + TILE / 2 - info.w / 2, y, groundY: y, vx: 0, vy: 0, face: -1,
    state: 'intro', timer: 1.8, shot: 1, inv: 0, dead: false, deathT: 0, t: 0,
    grounded: true, attackN: 0, target: null, summoned: false,
  };
}

function bossVulnerable(b) {
  return b.kind === 1 || (b.kind === 2 && b.state === 'stunned') || (b.kind === 3 && b.state === 'tired');
}

// Наземная физика (Громобот)
function bossGround(L, b, dt) {
  b.vy = Math.min(b.vy + GRAVITY * dt, MAX_FALL);
  b.x += b.vx * dt;
  const midY = Math.floor((b.y + b.h / 2) / TILE);
  if (b.vx > 0 && L.solid(Math.floor((b.x + b.w) / TILE), midY)) { b.x = Math.floor((b.x + b.w) / TILE) * TILE - b.w; b.vx = 0; }
  if (b.vx < 0 && L.solid(Math.floor(b.x / TILE), midY)) { b.x = (Math.floor(b.x / TILE) + 1) * TILE; b.vx = 0; }
  b.y += b.vy * dt;
  const was = b.grounded;
  b.grounded = false;
  if (b.vy >= 0) {
    const ty = Math.floor((b.y + b.h) / TILE);
    for (const cx of [b.x + 4, b.x + b.w / 2, b.x + b.w - 4]) {
      if (L.solid(Math.floor(cx / TILE), ty)) { b.y = ty * TILE - b.h; b.vy = 0; b.grounded = true; break; }
    }
  }
  return !was && b.grounded;
}

function shockwaves(L, b, speed) {
  const y = b.y + b.h - 22;
  L.bullets.push({ kind: 'wave', x: b.x - 22, y, w: 22, h: 22, vx: -speed, vy: 0, life: 5 });
  L.bullets.push({ kind: 'wave', x: b.x + b.w, y, w: 22, h: 22, vx: speed, vy: 0, life: 5 });
}

function updateBoss(L, b, p, dt) {
  b.t += dt;
  b.inv = Math.max(0, b.inv - dt);
  if (b.dead) {
    b.deathT -= dt;
    if (b.deathT > 0 && Math.random() < 0.3) {
      emit(b.x + rand(0, b.w), b.y + rand(0, b.h), 10, { color: ['#ffd54a', '#ff7a3d', '#fff'], speed: 260, life: 0.6 });
      if (Math.random() < 0.3) Sound.play('boom');
    }
    return;
  }
  const pcx = p.x + p.w / 2;
  const dx = pcx - (b.x + b.w / 2);

  if (b.state === 'intro') {
    if (b.kind === 1) bossGround(L, b, dt);
    b.timer -= dt;
    if (b.timer <= 0) {
      b.state = b.kind === 1 ? 'walk' : b.kind === 2 ? 'rise' : 'float';
      b.timer = 1.5;
    }
    return;
  }

  if (b.kind === 1) {
    // ---------- Громобот: ходит, прыгает, пускает ударные волны
    const rage = b.hp <= 3;
    const landed = bossGround(L, b, dt);
    if (b.state === 'walk') {
      b.face = dx > 0 ? 1 : -1;
      b.vx = Math.abs(dx) > 20 ? b.face * (rage ? 140 : 90) : 0;
      b.timer -= dt;
      if (b.timer <= 0) { b.state = 'crouch'; b.timer = 0.45; b.vx = 0; }
    } else if (b.state === 'crouch') {
      b.vx = 0;
      b.timer -= dt;
      if (b.timer <= 0) { b.state = 'jump'; b.vy = -820; b.vx = b.face * (rage ? 220 : 160); b.grounded = false; Sound.play('bossJump'); }
    } else if (b.state === 'jump') {
      if (landed) {
        shockwaves(L, b, rage ? 340 : 270);
        Game.shake = Math.max(Game.shake, 12);
        Sound.play('thud');
        emit(b.x + b.w / 2, b.y + b.h, 24, { color: ['#bfb6a6', '#fff'], angle: -Math.PI / 2, spread: 1.6, speed: 260, life: 0.6 });
        if (rage) {
          for (const k of [-1, 0, 1]) {
            L.bullets.push({ kind: 'ball', x: b.x + b.w / 2, y: b.y + 8, vx: k * 190, vy: -520, grav: 900, r: 7, life: 4 });
          }
        }
        b.state = 'walk';
        b.timer = rand(1.6, 2.8);
        b.vx = 0;
      }
    }
  } else if (b.kind === 2) {
    // ---------- Буревестник: бомбы сверху и падение-таран
    const rage = b.hp <= 3;
    const minX = TILE * 2, maxX = L.w - TILE * 2 - b.w;
    if (b.state === 'hover') {
      const tx = clamp(L.w / 2 + Math.sin(b.t * 0.7) * (L.w / 2 - 160) - b.w / 2, minX, maxX);
      b.x = lerp(b.x, tx, Math.min(1, dt * 2));
      b.y = lerp(b.y, TILE * 2, Math.min(1, dt * 2));
      b.face = dx > 0 ? 1 : -1;
      b.shot -= dt;
      if (b.shot <= 0) {
        b.shot = rage ? 0.75 : 1.2;
        L.bullets.push({ kind: 'bomb', x: b.x + b.w / 2, y: b.y + b.h, vx: rand(-90, 90), vy: 0, grav: 900, r: 8, life: 4 });
        Sound.play('shoot');
      }
      b.timer -= dt;
      if (b.timer <= 0) { b.state = 'aim'; b.timer = 0.9; Sound.play('thunder'); Game.lightning = 0.4; }
    } else if (b.state === 'aim') {
      b.x = lerp(b.x, clamp(pcx - b.w / 2, minX, maxX), Math.min(1, dt * 5));
      b.y = lerp(b.y, TILE * 1.5, Math.min(1, dt * 4));
      b.timer -= dt;
      if (b.timer <= 0) { b.state = 'dive'; b.vy = 200; }
    } else if (b.state === 'dive') {
      b.vy += 2400 * dt;
      b.y += b.vy * dt;
      const ty = Math.floor((b.y + b.h) / TILE);
      if (L.solid(Math.floor((b.x + b.w / 2) / TILE), ty)) {
        b.y = ty * TILE - b.h;
        b.state = 'stunned';
        b.timer = rage ? 1.5 : 2;
        Game.shake = Math.max(Game.shake, 14);
        Sound.play('thud');
        shockwaves(L, b, 260);
      }
    } else if (b.state === 'stunned') {
      b.timer -= dt;
      if (b.timer <= 0) b.state = 'rise';
    } else if (b.state === 'rise') {
      b.y -= 260 * dt;
      if (b.y <= TILE * 2) { b.state = 'hover'; b.timer = rage ? 3.5 : 5; }
    }
  } else {
    // ---------- Ядро Хаоса: залпы, призыв, дождь, затем усталость
    const rage = b.hp <= 4;
    if (!b.target) b.target = { x: b.x, y: TILE * 3 };
    if (b.state === 'float') {
      b.x = lerp(b.x, b.target.x, Math.min(1, dt * 2));
      b.y = lerp(b.y, b.target.y, Math.min(1, dt * 2));
      b.timer -= dt;
      if (b.timer <= 0) {
        b.attackN++;
        b.state = ['burst', 'rain', 'summon', 'burst'][b.attackN % 4];
        b.timer = b.state === 'burst' ? (rage ? 2.4 : 1.8) : b.state === 'rain' ? 2.4 : 0.8;
        b.shot = 0.2;
        b.summoned = false;
      }
    } else if (b.state === 'burst') {
      b.timer -= dt; b.shot -= dt;
      if (b.shot <= 0) {
        b.shot = 0.6;
        const n = rage ? 14 : 10;
        for (let i = 0; i < n; i++) {
          const a = i / n * Math.PI * 2 + b.t;
          L.bullets.push({ kind: 'orb', x: b.x + b.w / 2, y: b.y + b.h / 2, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, r: 7, life: 5 });
        }
        Sound.play('shoot');
      }
      if (b.timer <= 0) { b.state = 'tired'; b.timer = 2.4; }
    } else if (b.state === 'rain') {
      b.timer -= dt; b.shot -= dt;
      if (b.shot <= 0) {
        b.shot = rage ? 0.12 : 0.18;
        L.bullets.push({ kind: 'orb', x: rand(TILE * 2, L.w - TILE * 2), y: Game.cam.y - 10, vx: 0, vy: rand(220, 300), r: 7, life: 4 });
      }
      if (b.timer <= 0) { b.state = 'tired'; b.timer = 2.4; }
    } else if (b.state === 'summon') {
      if (!b.summoned) {
        b.summoned = true;
        const alive = L.enemies.filter(e => e.alive).length;
        for (let i = 0; i < 2 && alive + i < 4; i++) {
          const e = makeEnemy(i % 2 ? 'F' : 'J', b.x + (i ? b.w + 10 : -40), Math.min(b.y, b.groundY - TILE));
          if (e.type === 'jumper') e.y = b.groundY + b.h - e.h;
          L.enemies.push(e);
          emit(e.x + e.w / 2, e.y + e.h / 2, 16, { color: ['#c06bff', '#fff'], speed: 200, life: 0.5 });
        }
        Sound.play('summon');
      }
      b.timer -= dt;
      if (b.timer <= 0) { b.state = 'tired'; b.timer = 2.4; }
    } else if (b.state === 'tired') {
      b.y = lerp(b.y, b.groundY, Math.min(1, dt * 3));
      b.timer -= dt;
      if (b.timer <= 0) {
        b.state = 'float';
        b.timer = 1.4;
        b.target = { x: rand(TILE * 4, L.w - TILE * 4 - b.w), y: rand(TILE * 2, TILE * 5) };
      }
    }
    b.face = dx > 0 ? 1 : -1;
  }
}

function hitBoss(L, b) {
  if (b.inv > 0 || b.dead) return false;
  b.hp--;
  b.inv = 0.9;
  Game.shake = Math.max(Game.shake, 10);
  Sound.play('bossHit');
  emit(b.x + b.w / 2, b.y + 10, 20, { color: ['#ffffff', '#ffd54a', '#ff5d73'], speed: 300, life: 0.6 });
  if (b.kind === 2) b.timer = Math.min(b.timer, 0.5);
  if (b.hp <= 0) {
    b.dead = true;
    b.deathT = 2;
    L.bullets.length = 0;
    for (const e of L.enemies) if (e.alive) { e.alive = false; e.deadT = 0.6; }
    if (L.goal) L.goal.hidden = false;
    Game.shake = 20;
    Sound.play('bossDie');
    UI.toast('<span class="t-title">Босс повержен!</span>Портал открыт — беги к финишу!', 3500);
  }
  UI.updateBoss(b);
  return true;
}

// Столкновение робота с боссом. Возвращает true, если робот погиб.
function bossContact(L, b, p, dt) {
  if (b.dead || p.dead || b.state === 'intro') return false;
  const bb = { x: b.x + 4, y: b.y + 4, w: b.w - 8, h: b.h - 4 };
  if (!overlap(p, bb)) return false;
  const vulnerable = bossVulnerable(b);
  const fromAbove = p.vy > 0 && (p.y + p.h) - p.vy * dt <= b.y + 16;
  if (fromAbove) {
    if (vulnerable) hitBoss(L, b);
    p.y = b.y - p.h;
    p.vy = -STOMP_V * (vulnerable ? 1.25 : 1);
    p.bounced = true; p.jumps = 1; p.canDash = true; p.sx = 0.8; p.sy = 1.2;
    return false;
  }
  if (p.dashT > 0) {
    if (b.kind === 3 && vulnerable) hitBoss(L, b);
    p.dashT = 0;
    p.vx = -p.dashDir * 380;
    p.vy = -380;
    p.wallLock = 0.25;
    return false;
  }
  if (vulnerable && b.kind !== 1) return false;   // оглушённый босс не опасен
  if (b.inv > 0.5) return false;                  // сразу после удара
  if (p.spawnT > 0) return false;
  killPlayer();
  return true;
}

// После гибели робота даём ему передышку
function resetBossAfterDeath(L, b) {
  if (!b || b.dead) return;
  if (b.kind === 1) {
    if (Math.abs(b.x - L.start.x) < TILE * 9) b.x = L.w - TILE * 10;
    b.state = 'walk'; b.timer = 2; b.vx = 0;
  } else if (b.kind === 2) {
    b.state = 'rise';
  } else {
    b.state = 'float'; b.timer = 2;
    b.target = { x: L.w - TILE * 10, y: TILE * 3 };
  }
}

// ---------- Отрисовка ----------
function drawBoss(L, b, t) {
  if (b.dead && b.deathT <= 0) return;
  ctx.save();
  if (b.dead) ctx.globalAlpha = Math.max(0, b.deathT / 2);
  else if (b.inv > 0 && Math.floor(b.inv * 20) % 2 === 0) ctx.globalAlpha = 0.45;
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;

  if (b.kind === 1) {
    ctx.translate(cx, b.y + b.h);
    ctx.scale(b.face, b.state === 'crouch' ? 0.85 : 1);
    const rage = b.hp <= 3;
    const step = b.grounded && b.vx ? Math.sin(b.t * 10) * 4 : 0;
    ctx.fillStyle = '#3a3f55';
    ctx.fillRect(-24 + step, -14, 14, 14); ctx.fillRect(10 - step, -14, 14, 14);
    ctx.fillStyle = '#5a6078';
    ctx.fillRect(-42, -46, 12, 26); ctx.fillRect(30, -46, 12, 26);
    ctx.fillStyle = '#2b2f40';
    ctx.fillRect(-44, -22, 16, 8); ctx.fillRect(28, -22, 16, 8);
    ctx.fillStyle = rage ? '#e0452f' : '#c0392b';
    roundRect(ctx, -32, -58, 64, 46, 10); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    roundRect(ctx, -28, -56, 40, 6, 3); ctx.fill();
    ctx.fillStyle = '#8e2a20';
    roundRect(ctx, -20, -30, 40, 12, 4); ctx.fill();
    ctx.fillStyle = '#ffd54a';
    for (let i = 0; i < 4; i++) ctx.fillRect(-16 + i * 9, -26, 5, 4);
    ctx.fillStyle = '#1a1a2e';
    roundRect(ctx, -22, -52, 46, 17, 6); ctx.fill();
    ctx.fillStyle = rage ? '#ffeb3b' : '#ff3b3b';
    ctx.fillRect(-12, -48, 10, 8); ctx.fillRect(6, -48, 10, 8);
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.moveTo(-14, -50); ctx.lineTo(0, -46); ctx.lineTo(-14, -46); ctx.fill();
    ctx.beginPath(); ctx.moveTo(18, -50); ctx.lineTo(4, -46); ctx.lineTo(18, -46); ctx.fill();
    ctx.fillStyle = '#5a6078';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(-18 + i * 14, -58); ctx.lineTo(-12 + i * 14, -68); ctx.lineTo(-6 + i * 14, -58); ctx.fill();
    }
  } else if (b.kind === 2) {
    const stunned = b.state === 'stunned';
    const body = stunned ? '#8a8fa8' : b.hp <= 3 ? '#3b2f55' : '#4a4e6a';
    if (b.state === 'aim' || b.state === 'hover') {
      ctx.strokeStyle = b.state === 'aim' ? '#fff27a' : 'rgba(255,242,122,0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      let x = cx, y = b.y + b.h;
      ctx.moveTo(x, y);
      for (let i = 0; i < 4; i++) { x += (i % 2 ? 8 : -8) + Math.sin(t * 50 + i) * 3; y += 10; ctx.lineTo(x, y); }
      if (b.state === 'aim' || Math.sin(t * 13) > 0.7) ctx.stroke();
    }
    ctx.fillStyle = body;
    const blobs = [[-26, 6, 26, 18], [26, 6, 26, 18], [0, -6, 32, 24], [-10, 12, 30, 14], [12, 12, 28, 14]];
    for (const [ox, oy, rx, ry] of blobs) {
      ctx.beginPath(); ctx.ellipse(cx + ox, cy + oy + Math.sin(t * 2 + ox) * 1.5, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.ellipse(cx - 6, cy - 16, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
    if (stunned) {
      ctx.strokeStyle = '#1b1b2a'; ctx.lineWidth = 3;
      for (const ex of [-12, 12]) {
        ctx.beginPath(); ctx.moveTo(cx + ex - 5, cy - 6); ctx.lineTo(cx + ex + 5, cy + 4);
        ctx.moveTo(cx + ex + 5, cy - 6); ctx.lineTo(cx + ex - 5, cy + 4); ctx.stroke();
      }
      ctx.fillStyle = '#ffd54a';
      for (let i = 0; i < 4; i++) { const a = t * 5 + i * 1.57; ctx.fillRect(cx + Math.cos(a) * 30 - 3, b.y - 6 + Math.sin(a) * 6, 6, 6); }
    } else {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(cx - 12, cy, 8, 7, 0, 0, Math.PI * 2); ctx.ellipse(cx + 12, cy, 8, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff3b3b';
      ctx.beginPath(); ctx.arc(cx - 12 + b.face * 3, cy + 1, 3.5, 0, Math.PI * 2); ctx.arc(cx + 12 + b.face * 3, cy + 1, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.moveTo(cx - 22, cy - 10); ctx.lineTo(cx - 4, cy - 3); ctx.lineTo(cx - 22, cy - 3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + 22, cy - 10); ctx.lineTo(cx + 4, cy - 3); ctx.lineTo(cx + 22, cy - 3); ctx.fill();
    }
  } else {
    const tired = b.state === 'tired';
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 52);
    g.addColorStop(0, tired ? 'rgba(255,120,170,0.35)' : 'rgba(255,90,160,0.6)');
    g.addColorStop(1, 'rgba(255,90,160,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = tired ? '#8a3a62' : '#ff3d7f';
    ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(cx - 8, cy - 9, 9, 0, Math.PI * 2); ctx.fill();
    // глаз следит за роботом
    const p = Game.player;
    const ang = p ? Math.atan2(p.y - cy, p.x - cx) : 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(cx, cy, 12, tired ? 4 : 11, 0, 0, Math.PI * 2); ctx.fill();
    if (!tired) {
      ctx.fillStyle = '#1b0b2a';
      ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * 5, cy + Math.sin(ang) * 5, 5, 0, Math.PI * 2); ctx.fill();
      // щит
      ctx.strokeStyle = b.hp <= 4 ? '#ffb3e0' : '#8fe9ff';
      ctx.lineWidth = 4;
      for (let i = 0; i < 4; i++) {
        const a = b.t * 2 + i * Math.PI / 2;
        ctx.beginPath(); ctx.arc(cx, cy, 38, a, a + 0.9); ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#ffd54a';
      ctx.font = 'bold 12px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('z', cx + 24, cy - 26 - (b.t * 20 % 12));
    }
  }
  ctx.restore();
}
