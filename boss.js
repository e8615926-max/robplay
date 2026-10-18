'use strict';

// ============================================================
//  Боссы (каждый 10-й уровень)
// ============================================================
const BOSS_INFO = {
  1: { name: 'Громобот', name_en: 'Thunderbot', hp: 6, w: 64, h: 60 },
  2: { name: 'Буревестник', name_en: 'Stormbird', hp: 6, w: 88, h: 52 },
  3: { name: 'Ядро Хаоса', name_en: 'Chaos Core', hp: 8, w: 64, h: 64 },
  4: { name: 'Механический Змей', name_en: 'Mecha Serpent', hp: 7, w: 44, h: 38 },
  5: { name: 'Омега', name_en: 'Omega', hp: 10, w: 76, h: 76 },
};

function makeBoss(kind, px, py) {
  const info = BOSS_INFO[kind];
  const y = py + TILE - info.h;
  return {
    kind, name: info.name, name_en: info.name_en, hp: info.hp, maxHp: info.hp, w: info.w, h: info.h,
    x: px + TILE / 2 - info.w / 2, y, groundY: y, vx: 0, vy: 0, face: -1,
    state: 'intro', timer: 1.8, shot: 1, inv: 0, dead: false, deathT: 0, t: 0,
    grounded: true, attackN: 0, target: null, summoned: false, sinceTired: 0,
    segs: kind === 4 ? Array.from({ length: 7 }, (_, i) => ({ x: px + 16 + i * 4, y: py, r: 15 - i, vy: 0 })) : null,
  };
}

function bossVulnerable(b) {
  return b.kind === 1 || ((b.kind === 2 || b.kind === 4) && b.state === 'stunned') || ((b.kind === 3 || b.kind === 5) && b.state === 'tired');
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
      b.state = b.kind === 1 ? 'walk' : (b.kind === 2 || b.kind === 4) ? 'rise' : 'float';
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
  } else if (b.kind === 3) {
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
  } else if (b.kind === 4) {
    // ---------- Механический Змей: летает восьмёркой, плюётся огнём, падает-таранит
    const rage = b.hp <= 3;
    const minX = TILE * 2, maxX = L.w - TILE * 2 - b.w;
    if (b.state === 'rise') {
      b.y = lerp(b.y, TILE * 3, Math.min(1, dt * 2.5));
      if (Math.abs(b.y - TILE * 3) < 8) { b.state = 'fly'; b.timer = rage ? 4 : 5.5; }
    } else if (b.state === 'fly') {
      const tx = clamp(L.w / 2 + Math.sin(b.t * 0.55) * (L.w / 2 - 140) - b.w / 2, minX, maxX);
      const ty = TILE * 3 + Math.sin(b.t * 1.3) * TILE * 1.4;
      const nx = lerp(b.x, tx, Math.min(1, dt * 2.2));
      if (Math.abs(nx - b.x) > 0.05) b.face = nx > b.x ? 1 : -1;
      b.x = nx;
      b.y = lerp(b.y, ty, Math.min(1, dt * 2.2));
      b.shot -= dt;
      if (b.shot <= 0) {
        b.shot = rage ? 0.95 : 1.5;
        const hx = b.x + b.w / 2 + b.face * 16, hy = b.y + b.h / 2;
        const a0 = Math.atan2(p.y + p.h / 2 - hy, pcx - hx);
        for (const da of rage ? [-0.28, 0, 0.28] : [0]) {
          L.bullets.push({ kind: 'ball', x: hx, y: hy, vx: Math.cos(a0 + da) * 240, vy: Math.sin(a0 + da) * 240, r: 7, life: 4 });
        }
        Sound.play('shoot');
      }
      b.timer -= dt;
      if (b.timer <= 0) { b.state = 'aim'; b.timer = 0.8; Sound.play('roar'); }
    } else if (b.state === 'aim') {
      b.x = lerp(b.x, clamp(pcx - b.w / 2, minX, maxX), Math.min(1, dt * 5));
      b.y = lerp(b.y, TILE * 1.5, Math.min(1, dt * 4));
      b.timer -= dt;
      if (b.timer <= 0) { b.state = 'dive'; b.vy = 200; }
    } else if (b.state === 'dive') {
      b.vy += 2600 * dt;
      b.y += b.vy * dt;
      const ty = Math.floor((b.y + b.h) / TILE);
      if (L.solid(Math.floor((b.x + b.w / 2) / TILE), ty)) {
        b.y = ty * TILE - b.h;
        b.state = 'stunned';
        b.timer = rage ? 1.6 : 2.2;
        Game.shake = Math.max(Game.shake, 14);
        Sound.play('thud');
        shockwaves(L, b, rage ? 320 : 260);
      }
    } else if (b.state === 'stunned') {
      b.timer -= dt;
      if (b.timer <= 0) { b.state = 'rise'; Sound.play('roar'); }
    }
    updateSegments(L, b, dt);
  } else {
    // ---------- Омега: лазеры, залпы, призыв, удар о землю, усталость
    const rage = b.hp <= 5;
    if (!b.target) b.target = { x: b.x, y: TILE * 3 };
    const next = () => {
      b.sinceTired++;
      if (b.sinceTired >= 2) { b.state = 'tired'; b.timer = 2.6; b.sinceTired = 0; }
      else { b.state = 'float'; b.timer = 1; b.target = { x: rand(TILE * 4, L.w - TILE * 4 - b.w), y: rand(TILE * 2, TILE * 4) }; }
    };
    if (b.state === 'float') {
      b.x = lerp(b.x, b.target.x, Math.min(1, dt * 2));
      b.y = lerp(b.y, b.target.y, Math.min(1, dt * 2));
      b.timer -= dt;
      if (b.timer <= 0) {
        const a = ['laser', 'burst', 'summon', 'laser', 'slam'][b.attackN % 5];
        b.attackN++;
        b.state = a; b.shot = 0; b.summoned = false; b.vy = 0;
        b.timer = { laser: rage ? 2.6 : 1.8, burst: rage ? 2.4 : 1.8, summon: 0.8, slam: 0.7 }[a];
      }
    } else if (b.state === 'laser') {
      b.shot -= dt;
      if (b.shot <= 0) {
        b.shot = rage ? 0.9 : 99;
        const ys = [p.y + p.h / 2];
        if (rage) ys.push(p.y + p.h / 2 + (Math.random() < 0.5 ? -1 : 1) * TILE * 2.5);
        for (const y of ys) L.bullets.push({ kind: 'laser', x: 0, y: clamp(y, TILE, b.groundY + b.h - 12), vx: 0, vy: 0, r: 0, life: 1.4, warn: 0.85 });
        Sound.play('laserCharge');
      }
      b.timer -= dt;
      if (b.timer <= 0) next();
    } else if (b.state === 'burst') {
      b.timer -= dt; b.shot -= dt;
      if (b.shot <= 0) {
        b.shot = 0.6;
        const n = rage ? 16 : 12;
        for (let i = 0; i < n; i++) {
          const a = i / n * Math.PI * 2 + b.t * 0.7;
          L.bullets.push({ kind: 'orb', x: b.x + b.w / 2, y: b.y + b.h / 2, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, r: 7, life: 5 });
        }
        Sound.play('shoot');
      }
      if (b.timer <= 0) next();
    } else if (b.state === 'summon') {
      if (!b.summoned) {
        b.summoned = true;
        const alive = L.enemies.filter(e => e.alive).length;
        const pool = ['F', 'J', 'W', 'N', 'Y'];
        for (let i = 0; i < 2 && alive + i < 4; i++) {
          const e = makeEnemy(pool[Math.floor(Math.random() * pool.length)], b.x + (i ? b.w + 10 : -40), Math.min(b.y, b.groundY - TILE));
          if (e.type !== 'flyer' && e.type !== 'swooper') e.y = b.groundY + b.h - e.h;
          if (e.y0 !== undefined) e.y0 = e.y;
          if (e.x0 !== undefined) e.x0 = e.x;
          L.enemies.push(e);
          emit(e.x + e.w / 2, e.y + e.h / 2, 16, { color: ['#ff3b5c', '#fff'], speed: 200, life: 0.5 });
        }
        Sound.play('summon');
      }
      b.timer -= dt;
      if (b.timer <= 0) next();
    } else if (b.state === 'slam') {
      if (b.timer > 0) {
        b.timer -= dt;
        b.x = lerp(b.x, clamp(pcx - b.w / 2, TILE * 2, L.w - TILE * 2 - b.w), Math.min(1, dt * 4));
        b.y = lerp(b.y, TILE * 1.2, Math.min(1, dt * 4));
      } else {
        b.vy += 2600 * dt;
        b.y += b.vy * dt;
        if (b.y >= b.groundY) {
          b.y = b.groundY;
          shockwaves(L, b, rage ? 340 : 280);
          Game.shake = Math.max(Game.shake, 14);
          Sound.play('thud');
          b.state = 'tired'; b.timer = 2.6; b.sinceTired = 0;
        }
      }
    } else if (b.state === 'tired') {
      b.y = lerp(b.y, b.groundY, Math.min(1, dt * 3));
      b.timer -= dt;
      if (b.timer <= 0) {
        b.state = 'float'; b.timer = 1.2;
        b.target = { x: rand(TILE * 4, L.w - TILE * 4 - b.w), y: rand(TILE * 2, TILE * 4) };
      }
    }
    b.face = dx > 0 ? 1 : -1;
  }
}

// Тело змея: звенья тянутся за головой, при оглушении падают на землю
function updateSegments(L, b, dt) {
  const floor = b.groundY + b.h;
  let px = b.x + b.w / 2 - b.face * 14, py = b.y + b.h / 2;
  for (const s of b.segs) {
    if (b.state === 'stunned' || b.dead) {
      s.vy += 1500 * dt;
      s.y = Math.min(s.y + s.vy * dt, floor - s.r);
      if (s.y >= floor - s.r) s.vy = 0;
    } else s.vy = 0;
    const dx = s.x - px, dy = s.y - py, d = Math.hypot(dx, dy) || 1;
    if (d > 20) { s.x = px + dx / d * 20; s.y = py + dy / d * 20; }
    px = s.x; py = s.y;
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
  if (b.kind === 4) b.timer = Math.min(b.timer, 0.6);
  if (b.hp <= 0) {
    b.dead = true;
    b.deathT = 2;
    L.bullets.length = 0;
    for (const e of L.enemies) if (e.alive) { e.alive = false; e.deadT = 0.6; }
    if (L.goal) L.goal.hidden = false;
    Save.data.stats.bosses++;
    floatText(b.x + b.w / 2, b.y - 10, '+50', '#ffd54a', 'coin');
    Game.shake = 20;
    Sound.play('bossDie');
    UI.toast(`<span class="t-title">${T('bossDown')}</span>${T('portalOpen')}`, 3500);
  }
  UI.updateBoss(b);
  return true;
}

// Столкновение робота с боссом. Возвращает true, если робот погиб.
function bossContact(L, b, p, dt) {
  if (b.dead || p.dead || b.state === 'intro') return false;
  if (b.kind === 4 && b.state !== 'stunned') {
    // звенья змея: сверху — пружинят, сбоку — опасны
    for (const s of b.segs) {
      const cx = clamp(s.x, p.x, p.x + p.w), cy = clamp(s.y, p.y, p.y + p.h);
      if ((s.x - cx) ** 2 + (s.y - cy) ** 2 > s.r * s.r) continue;
      if (p.vy > 0 && p.y + p.h - p.vy * dt <= s.y - s.r + 8) {
        p.y = s.y - s.r - p.h; p.vy = -STOMP_V; p.bounced = true; p.jumps = airJumps(); refillAbility(p);
        Sound.play('ding');
        return false;
      }
      if (p.spawnT > 0 || p.dashT > 0) return false;
      killPlayer();
      return true;
    }
  }
  const bb = { x: b.x + 4, y: b.y + 4, w: b.w - 8, h: b.h - 4 };
  if (!overlap(p, bb)) return false;
  const vulnerable = bossVulnerable(b);
  const fromAbove = p.vy > 0 && (p.y + p.h) - p.vy * dt <= b.y + 16;
  if (fromAbove) {
    if (vulnerable) hitBoss(L, b);
    p.y = b.y - p.h;
    p.vy = -STOMP_V * (vulnerable ? 1.25 : 1);
    p.bounced = true; p.jumps = airJumps(); refillAbility(p); p.sx = 0.8; p.sy = 1.2;
    return false;
  }
  if (p.dashT > 0) {
    if (b.kind !== 1 && vulnerable) hitBoss(L, b);
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
  } else if (b.kind === 2 || b.kind === 4) {
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
  } else if (b.kind === 3) {
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
  } else if (b.kind === 4) {
    drawSerpent(b, t, cx, cy);
  } else {
    drawOmega(b, t, cx, cy);
  }
  ctx.restore();
}

function drawSerpent(b, t, cx, cy) {
  const stunned = b.state === 'stunned';
  // тело — от хвоста к голове
  for (let i = b.segs.length - 1; i >= 0; i--) {
    const s = b.segs[i];
    ctx.fillStyle = i % 2 ? '#5a6078' : '#6b7390';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.arc(s.x - s.r * 0.3, s.y - s.r * 0.35, s.r * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffb347';
    ctx.beginPath(); ctx.moveTo(s.x - 4, s.y - s.r + 2); ctx.lineTo(s.x, s.y - s.r - 7); ctx.lineTo(s.x + 4, s.y - s.r + 2); ctx.fill();
    ctx.fillStyle = Math.sin(t * 6 + i) > 0 ? '#8fe9ff' : '#3a7ab0';
    ctx.beginPath(); ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  // голова
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(b.face, 1);
  const jaw = b.state === 'fly' && b.shot < 0.25 ? 6 : b.state === 'aim' ? 8 : 2;
  ctx.fillStyle = '#4a5068';
  roundRect(ctx, -22, -2, 40, 12 + jaw, 5); ctx.fill();
  ctx.fillStyle = b.hp <= 3 ? '#c0392b' : '#7d86a8';
  roundRect(ctx, -22, -19, 46, 22, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; roundRect(ctx, -18, -17, 30, 5, 3); ctx.fill();
  ctx.fillStyle = '#ffd54a';
  ctx.beginPath(); ctx.moveTo(-14, -18); ctx.lineTo(-22, -32); ctx.lineTo(-6, -19); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(-4, -30); ctx.lineTo(8, -19); ctx.fill();
  ctx.fillStyle = '#fff';
  for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-4 + k * 6, 3); ctx.lineTo(-1 + k * 6, 3 + 4); ctx.lineTo(2 + k * 6, 3); ctx.fill(); }
  if (stunned) {
    ctx.strokeStyle = '#1b1b2a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(6, -12); ctx.lineTo(14, -4); ctx.moveTo(14, -12); ctx.lineTo(6, -4); ctx.stroke();
  } else {
    ctx.fillStyle = '#1b1b2a'; ctx.fillRect(5, -13, 11, 9);
    ctx.fillStyle = b.state === 'aim' ? '#ffeb3b' : '#ff3b3b'; ctx.fillRect(9, -11, 5, 5);
  }
  if (b.state === 'fly' && b.shot < 0.3) {
    ctx.fillStyle = 'rgba(255,140,40,0.7)';
    ctx.beginPath(); ctx.arc(22, 6, 6 + Math.sin(t * 40) * 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (stunned) {
    ctx.fillStyle = '#ffd54a';
    for (let k = 0; k < 4; k++) { const a = t * 5 + k * 1.57; ctx.fillRect(cx + Math.cos(a) * 26 - 3, b.y - 10 + Math.sin(a) * 5, 6, 6); }
  }
}

function drawOmega(b, t, cx, cy) {
  const tired = b.state === 'tired', rage = b.hp <= 5;
  const R = 34;
  // ореол
  const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 70);
  g.addColorStop(0, rage ? 'rgba(255,60,90,0.45)' : 'rgba(0,255,200,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 70, 0, Math.PI * 2); ctx.fill();
  // антенны
  ctx.strokeStyle = '#8a93b0'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - 14, cy - R + 4); ctx.lineTo(cx - 22, cy - R - 16); ctx.moveTo(cx + 14, cy - R + 4); ctx.lineTo(cx + 22, cy - R - 16); ctx.stroke();
  ctx.fillStyle = Math.sin(t * 8) > 0 ? '#ff3b5c' : '#5a1020';
  ctx.beginPath(); ctx.arc(cx - 22, cy - R - 17, 4, 0, Math.PI * 2); ctx.arc(cx + 22, cy - R - 17, 4, 0, Math.PI * 2); ctx.fill();
  // корпус
  const body = ctx.createRadialGradient(cx - 10, cy - 12, 4, cx, cy, R);
  body.addColorStop(0, '#9aa3bd'); body.addColorStop(1, '#2b2f40');
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  // визор
  ctx.fillStyle = '#0b0f1a';
  roundRect(ctx, cx - R + 4, cy - 9, R * 2 - 8, 18, 9); ctx.fill();
  const p = Game.player;
  const look = p ? clamp((p.x + p.w / 2 - cx) / 200, -1, 1) : 0;
  if (!tired) {
    ctx.fillStyle = rage ? '#ff3b5c' : '#00ffc8';
    ctx.beginPath(); ctx.ellipse(cx + look * 18, cy, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + look * 18 - 2, cy - 2, 2, 0, Math.PI * 2); ctx.fill();
    // щит из шестиугольников
    ctx.strokeStyle = rage ? 'rgba(255,120,150,0.7)' : 'rgba(0,255,200,0.6)'; ctx.lineWidth = 2;
    for (let k = 0; k < 6; k++) {
      const a = b.t * 1.2 + k * Math.PI / 3, hx = cx + Math.cos(a) * (R + 12), hy = cy + Math.sin(a) * (R + 12);
      ctx.beginPath();
      for (let j = 0; j < 6; j++) { const aa = j * Math.PI / 3; ctx.lineTo(hx + Math.cos(aa) * 7, hy + Math.sin(aa) * 7); }
      ctx.closePath(); ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#3a4a5a'; ctx.fillRect(cx - 12, cy - 1, 24, 2);
    if (Math.random() < 0.3) emit(cx + rand(-R, R), cy + rand(-R, R), 1, { color: ['#ffd54a', '#8fe9ff'], speed: 80, life: 0.3, size: 3 });
  }
  if (rage) {
    ctx.strokeStyle = 'rgba(20,20,30,0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 20, cy - 26); ctx.lineTo(cx - 12, cy - 16); ctx.lineTo(cx - 16, cy - 10);
    ctx.moveTo(cx + 18, cy + 14); ctx.lineTo(cx + 10, cy + 22); ctx.lineTo(cx + 14, cy + 30); ctx.stroke();
  }
}
