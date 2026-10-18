'use strict';

// ============================================================
//  Способности (кнопка Shift / X) и пассивные улучшения
// ============================================================
const ABILITIES = [
  { id: 'dash', icon: 'dash', price: 0, up: [160, 360],
    name: 'Рывок', name_en: 'Dash',
    desc: 'Стремительный рывок, пробивает врагов. Ур. 2 — длиннее и чаще, ур. 3 — два рывка в воздухе.',
    desc_en: 'A quick burst that breaks through enemies. Lv 2 — longer and more often, Lv 3 — two dashes in the air.' },
  { id: 'pound', icon: 'pound', price: 180, up: [200, 420],
    name: 'Удар-молот', name_en: 'Ground Pound',
    desc: 'В воздухе — удар вниз. Ударная волна сбивает врагов рядом. Уровни увеличивают радиус.',
    desc_en: 'In the air — slam down. The shockwave knocks out nearby enemies. Levels increase the radius.' },
  { id: 'blaster', icon: 'blaster', price: 280, up: [260, 520],
    name: 'Бластер', name_en: 'Blaster',
    desc: 'Стреляет энергией: бьёт врагов, сбивает снаряды. Ур. 3 — двойной выстрел.',
    desc_en: 'Fires energy bolts: hits enemies and shoots down projectiles. Lv 3 — double shot.' },
  { id: 'glide', icon: 'glide', price: 220, up: [200, 400],
    name: 'Планер', name_en: 'Glider',
    desc: 'Держи кнопку в полёте, чтобы плавно парить. Уровни — медленнее падение.',
    desc_en: 'Hold the button in the air to glide. Levels make you fall slower.' },
  { id: 'blink', icon: 'blink', price: 350, up: [300, 600],
    name: 'Телепорт', name_en: 'Blink',
    desc: 'Мгновенный скачок вперёд сквозь врагов и снаряды. Уровни — дальше и чаще.',
    desc_en: 'Instantly blink forward through enemies and shots. Levels — farther and more often.' },
];

const PASSIVES = [
  { id: 'jumps', icon: 'jumps', cost: [350, 800], name: 'Доп. прыжок', name_en: 'Extra Jump',
    desc: '+1 прыжок в воздухе за уровень', desc_en: '+1 mid-air jump per level' },
  { id: 'hearts', icon: 'heart', cost: [150, 350, 700], name: 'Сердца', name_en: 'Hearts',
    desc: '+1 удар, который ты выдержишь', desc_en: '+1 hit you can survive' },
  { id: 'magnet', icon: 'magnet', cost: [100, 250, 500], name: 'Магнит', name_en: 'Magnet',
    desc: 'Монеты рядом сами летят к тебе', desc_en: 'Nearby coins fly to you' },
  { id: 'speed', icon: 'speed', cost: [120, 300, 600], name: 'Скорость', name_en: 'Speed',
    desc: '+6% к скорости бега за уровень', desc_en: '+6% running speed per level' },
];

function abilState() {
  if (!Save.data.abil) Save.data.abil = { equipped: 'dash', lv: { dash: 1 }, pas: {} };
  return Save.data.abil;
}
function abilLv(id) { return abilState().lv[id] || 0; }
function pasLv(id) { return abilState().pas[id] || 0; }
function equipped() { return abilState().equipped; }
function airJumps() { return 1 + pasLv('jumps'); }
function maxHearts() { return 1 + pasLv('hearts'); }
function runSpeed() { return RUN * (1 + 0.06 * pasLv('speed')); }
function maxAirDashes() { return equipped() === 'dash' && abilLv('dash') >= 3 ? 2 : 1; }
function refillAbility(p) { p.canDash = true; p.airDashes = maxAirDashes(); }
function abilityReady(p) {
  const id = equipped();
  if (p.dashCD > 0 || p.dashT > 0 || p.pound) return false;
  if (id === 'dash') return p.airDashes > 0;
  if (id === 'pound') return p.onGround || p.canDash;
  return true;
}

// Проверка: пересекает ли прямоугольник твёрдые блоки
function rectHitsSolid(L, x, y, w, h) {
  const l = Math.floor(x / TILE), r = Math.floor((x + w - 0.01) / TILE);
  const t = Math.floor(y / TILE), b = Math.floor((y + h - 0.01) / TILE);
  for (let ty = t; ty <= b; ty++) for (let tx = l; tx <= r; tx++) if (L.solid(tx, ty)) return true;
  return false;
}

function useAbility(p, dir) {
  const id = equipped(), lv = Math.max(1, abilLv(id));
  const L = Game.level;
  if (p.dashCD > 0 || p.dashT > 0 || p.pound) return;
  switch (id) {
    case 'dash': {
      if (p.airDashes <= 0) return;
      p.airDashes--;
      p.dashT = DASH_T * (1 + 0.25 * (lv - 1));
      p.dashCD = DASH_CD * (1 - 0.2 * (lv - 1));
      p.canDash = p.airDashes > 0;
      p.dashDir = dir || p.face; p.face = p.dashDir;
      p.vy = 0; p.sx = 1.4; p.sy = 0.7;
      Game.shake = Math.max(Game.shake, 4);
      emit(p.x + p.w / 2, p.y + p.h / 2, 12, { color: ['#ffd54a', '#fff'], angle: p.dashDir > 0 ? Math.PI : 0, spread: 0.5, speed: 260, grav: 0, life: 0.4 });
      Sound.play('dash');
      break;
    }
    case 'pound':
      if (p.onGround || !p.canDash) return;
      p.canDash = false;
      p.pound = true; p.poundHang = 0.12;
      p.vx = 0; p.vy = 0; p.sx = 0.8; p.sy = 1.2;
      Sound.play('poundStart');
      break;
    case 'blaster': {
      p.dashCD = 0.55 - 0.12 * (lv - 1);
      const shots = lv >= 3 ? [-55, 55] : [0];
      for (const vy of shots) {
        L.pbullets.push({ x: p.x + p.w / 2 + p.face * 14, y: p.y + 13, vx: p.face * 560, vy, life: 0.5 + 0.15 * (lv - 1) });
      }
      p.vx -= p.face * 40;
      emit(p.x + p.w / 2 + p.face * 16, p.y + 13, 5, { color: ['#8fe9ff', '#fff'], angle: p.face > 0 ? 0 : Math.PI, spread: 0.6, speed: 160, grav: 0, life: 0.2 });
      Sound.play('laser');
      break;
    }
    case 'glide':
      return; // работает, пока кнопка зажата
    case 'blink': {
      const dist = 90 + 30 * (lv - 1);
      const dx = (dir || p.face);
      const ox = p.x, oy = p.y;
      let moved = 0;
      while (moved < dist && !rectHitsSolid(L, p.x + dx * 4, p.y, p.w, p.h)) { p.x += dx * 4; moved += 4; }
      if (moved === 0) return;
      p.face = dx;
      p.dashCD = 0.9 - 0.15 * (lv - 1);
      p.spawnT = Math.max(p.spawnT, 0.25);
      p.vy = Math.min(p.vy, 0);
      emit(ox + p.w / 2, oy + p.h / 2, 16, { color: ['#b48cff', '#ece0ff'], speed: 160, grav: 0, life: 0.4 });
      emit(p.x + p.w / 2, p.y + p.h / 2, 16, { color: ['#b48cff', '#ece0ff'], speed: 160, grav: 0, life: 0.4 });
      ring(p.x + p.w / 2, p.y + p.h / 2, '#b48cff', 30);
      p.trail.push({ x: ox, y: oy, face: p.face, life: 0.25 });
      Sound.play('blink');
      break;
    }
  }
}

// Приземление после удара-молота
function poundImpact(p) {
  const L = Game.level, lv = Math.max(1, abilLv('pound'));
  p.pound = false;
  const r = 70 + 35 * (lv - 1);
  const cx = p.x + p.w / 2, by = p.y + p.h;
  Game.shake = Math.max(Game.shake, 9);
  Sound.play('thud');
  emit(cx, by, 26, { color: ['#ffffff', '#ffd54a', '#bfb6a6'], angle: -Math.PI / 2, spread: 1.5, speed: 300, life: 0.6 });
  ring(cx, by, '#ffd54a', r);
  for (const e of L.enemies) {
    if (!e.alive || !ENEMY_INFO[e.type].dash) continue;
    if (Math.abs(e.x + e.w / 2 - cx) < r && Math.abs(e.y + e.h - by) < 48) killEnemy(e, null, false);
  }
  const b = L.boss;
  if (b && !b.dead && bossVulnerable(b) && Math.abs(b.x + b.w / 2 - cx) < r + b.w / 2 && Math.abs(b.y + b.h - by) < 60) hitBoss(L, b);
}

// Выстрелы бластера
function updatePBullets(L, dt) {
  for (let i = L.pbullets.length - 1; i >= 0; i--) {
    const s = L.pbullets[i];
    s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
    let hit = s.life <= 0 || L.solid(Math.floor(s.x / TILE), Math.floor(s.y / TILE));
    const box = { x: s.x - 6, y: s.y - 4, w: 12, h: 8 };
    if (!hit) {
      for (const e of L.enemies) {
        if (!e.alive || !overlap(box, e)) continue;
        if (e.type === 'saw' || e.type === 'dropper' || (e.type === 'turtle' && Math.sign(s.vx) === -e.face)) { Sound.play('ding'); }
        else killEnemy(e, null, false);
        hit = true; break;
      }
    }
    if (!hit) {
      for (let k = L.bullets.length - 1; k >= 0; k--) {
        const b = L.bullets[k];
        if (b.kind === 'wave' || b.kind === 'laser') continue;
        if (Math.abs(b.x - s.x) < b.r + 6 && Math.abs(b.y - s.y) < b.r + 6) {
          emit(b.x, b.y, 8, { color: ['#8fe9ff', '#fff'], speed: 140, life: 0.3 });
          L.bullets.splice(k, 1); hit = true; break;
        }
      }
    }
    const B = L.boss;
    if (!hit && B && !B.dead && B.state !== 'intro' && overlap(box, B)) {
      if (bossVulnerable(B)) hitBoss(L, B); else Sound.play('ding');
      hit = true;
    }
    if (hit) {
      emit(s.x, s.y, 6, { color: ['#8fe9ff', '#ffffff'], speed: 120, grav: 0, life: 0.25 });
      L.pbullets.splice(i, 1);
    }
  }
}

function drawPBullets(L, t) {
  for (const s of L.pbullets) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(Math.atan2(s.vy, s.vx));
    ctx.fillStyle = 'rgba(143,233,255,0.35)';
    ctx.beginPath(); ctx.ellipse(-6, 0, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d8fbff';
    ctx.beginPath(); ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// Планер над роботом
function drawGlider(p, t) {
  if (!p.gliding || p.dead) return;
  const cx = p.x + p.w / 2, top = p.y - 20 + Math.sin(t * 6) * 1.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 20, top); ctx.lineTo(cx - 6, p.y + 6); ctx.moveTo(cx + 20, top); ctx.lineTo(cx + 6, p.y + 6); ctx.stroke();
  ctx.fillStyle = '#ff7ac8';
  ctx.beginPath(); ctx.moveTo(cx - 22, top); ctx.quadraticCurveTo(cx, top - 22, cx + 22, top); ctx.quadraticCurveTo(cx, top - 6, cx - 22, top); ctx.fill();
  ctx.fillStyle = '#ffd54a';
  ctx.beginPath(); ctx.moveTo(cx - 7, top - 7); ctx.quadraticCurveTo(cx, top - 16, cx + 7, top - 7); ctx.quadraticCurveTo(cx, top - 10, cx - 7, top - 7); ctx.fill();
}
