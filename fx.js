'use strict';

// ============================================================
//  Погода и эффекты карт: дождь, снег, листья, светлячки,
//  песчаная буря, пузыри, искры, падающие звёзды, темнота
// ============================================================
const FX_COUNT = {
  rain: 170, snow: 120, leaves: 26, petals: 30, fireflies: 34, sand: 40,
  sandstorm: 150, bubbles: 40, embers: 0, sparks: 34, space: 4, feathers: 30, digital: 70,
};

const Weather = {
  kind: null, list: [], lightT: 6, prevCam: null,

  init(L) {
    this.kind = L.theme.fx;
    this.list = [];
    this.lightT = rand(3, 7);
    this.prevCam = null;
    const n = FX_COUNT[this.kind] || 0;
    for (let i = 0; i < n; i++) this.list.push(this.spawn(true));
  },

  spawn(anywhere) {
    const f = { x: rand(0, viewW), y: anywhere ? rand(0, viewH) : -10, t: rand(0, 10), s: rand(0.5, 1.2), vx: 0, vy: 0, rot: rand(0, 6) };
    switch (this.kind) {
      case 'rain': f.vx = -80; f.vy = rand(700, 950); break;
      case 'snow': f.vx = rand(-20, 20); f.vy = rand(30, 75); break;
      case 'leaves': case 'petals': f.vx = rand(20, 70); f.vy = rand(30, 60); f.c = Math.floor(rand(0, 3)); break;
      case 'fireflies': break;
      case 'sand': f.vx = rand(80, 160); f.vy = rand(-10, 10); f.x = anywhere ? f.x : -10; f.y = rand(0, viewH); break;
      case 'sandstorm': f.vx = rand(420, 680); f.vy = rand(-20, 40); if (!anywhere) { f.x = -20; f.y = rand(0, viewH); } break;
      case 'bubbles': if (!anywhere) f.y = viewH + 10; f.vy = -rand(30, 70); break;
      case 'sparks': f.vx = rand(-40, 40); f.vy = rand(60, 200); f.y = anywhere ? f.y : -10; break;
      case 'feathers': f.vx = rand(-30, 30); f.vy = rand(15, 35); break;
      case 'digital': f.vx = 0; f.vy = rand(120, 280); f.ch = '01<>{}#$/'[Math.floor(rand(0, 9))]; f.x = Math.round(f.x / 14) * 14; break;
      case 'space': f.x = rand(0, viewW); f.y = rand(-viewH, 0); f.vx = rand(500, 700); f.vy = rand(220, 320); f.wait = rand(0, 4); break;
    }
    return f;
  },

  update(dt, cam) {
    if (!this.kind) return;
    const dcx = this.prevCam ? cam.x - this.prevCam.x : 0;
    const dcy = this.prevCam ? cam.y - this.prevCam.y : 0;
    this.prevCam = { x: cam.x, y: cam.y };
    const W = viewW, H = viewH;
    for (let i = 0; i < this.list.length; i++) {
      const f = this.list[i];
      f.t += dt;
      if (this.kind === 'space') {
        if (f.wait > 0) { f.wait -= dt; continue; }
        f.x += f.vx * dt; f.y += f.vy * dt;
        if (f.x > W + 100 || f.y > H + 100) { this.list[i] = this.spawn(false); this.list[i].wait = rand(1, 5); this.list[i].x = rand(-200, W * 0.7); this.list[i].y = rand(-100, H * 0.3); }
        continue;
      }
      if (this.kind === 'fireflies') {
        f.x += Math.sin(f.t * 0.7 + f.rot) * 18 * dt - dcx * f.s;
        f.y += Math.cos(f.t * 0.9 + f.rot) * 14 * dt - dcy * f.s;
      } else {
        let vx = f.vx;
        if (this.kind === 'leaves' || this.kind === 'petals' || this.kind === 'snow' || this.kind === 'feathers') vx += Math.sin(f.t * 1.5 + f.rot) * 30;
        if (this.kind === 'digital' && Math.random() < dt * 4) f.ch = '01<>{}#$/'[Math.floor(rand(0, 9))];
        if (this.kind === 'bubbles') vx += Math.sin(f.t * 2 + f.rot) * 12;
        f.x += vx * dt * f.s - dcx * f.s;
        f.y += f.vy * dt * f.s - dcy * f.s;
        f.rot += dt * 2;
      }
      if (f.x < -30) f.x += W + 60;
      else if (f.x > W + 30) f.x -= W + 60;
      if (this.kind === 'bubbles') { if (f.y < -20) this.list[i] = this.spawn(false); else if (f.y > H + 30) f.y -= H + 40; }
      else if (f.y > H + 20) { this.list[i] = this.spawn(false); }
      else if (f.y < -40) f.y += H + 50;
    }
    if (this.kind === 'rain') {
      this.lightT -= dt;
      if (this.lightT <= 0) {
        this.lightT = rand(5, 11);
        Game.lightning = 0.5;
        setTimeout(() => Sound.play('thunder'), rand(150, 600));
      }
    }
  },

  draw(t) {
    if (!this.kind) return;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    switch (this.kind) {
      case 'rain':
        ctx.strokeStyle = 'rgba(190,215,255,0.45)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (const f of this.list) { ctx.moveTo(f.x, f.y); ctx.lineTo(f.x - 2 * f.s, f.y + 16 * f.s); }
        ctx.stroke();
        break;
      case 'snow':
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        for (const f of this.list) { ctx.beginPath(); ctx.arc(f.x, f.y, 1 + f.s * 2, 0, Math.PI * 2); ctx.fill(); }
        break;
      case 'leaves': case 'petals': {
        const cols = this.kind === 'leaves' ? ['#7bc96f', '#e3a23b', '#d9663b'] : ['#ffc2e2', '#ff8fc8', '#fff0f8'];
        for (const f of this.list) {
          ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
          ctx.fillStyle = cols[f.c];
          ctx.beginPath(); ctx.ellipse(0, 0, 5 * f.s + 1, 2.5 * f.s + 0.5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
        break;
      }
      case 'fireflies':
        for (const f of this.list) {
          const a = 0.3 + 0.7 * Math.max(0, Math.sin(f.t * 2 + f.rot));
          ctx.fillStyle = `rgba(210,255,120,${a * 0.25})`;
          ctx.beginPath(); ctx.arc(f.x, f.y, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgba(230,255,160,${a})`;
          ctx.fillRect(f.x - 1.5, f.y - 1.5, 3, 3);
        }
        break;
      case 'sand':
        ctx.fillStyle = 'rgba(255,230,180,0.6)';
        for (const f of this.list) ctx.fillRect(f.x, f.y, 2, 2);
        break;
      case 'sandstorm':
        ctx.fillStyle = 'rgba(214,170,110,0.18)';
        ctx.fillRect(0, 0, viewW, viewH);
        ctx.strokeStyle = 'rgba(240,210,160,0.45)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (const f of this.list) { ctx.moveTo(f.x, f.y); ctx.lineTo(f.x - 24 * f.s, f.y - 2); }
        ctx.stroke();
        break;
      case 'bubbles':
        ctx.strokeStyle = 'rgba(200,250,255,0.55)'; ctx.lineWidth = 1.2;
        for (const f of this.list) { ctx.beginPath(); ctx.arc(f.x, f.y, 2 + f.s * 4, 0, Math.PI * 2); ctx.stroke(); }
        // световые лучи
        ctx.fillStyle = 'rgba(180,255,255,0.05)';
        for (let i = 0; i < 4; i++) {
          const x = ((i * 260 + t * 12) % (viewW + 300)) - 150;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 70, 0); ctx.lineTo(x + 170, viewH); ctx.lineTo(x + 60, viewH); ctx.fill();
        }
        break;
      case 'feathers':
        for (const f of this.list) {
          ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(Math.sin(f.t * 2 + f.rot) * 0.8);
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.beginPath(); ctx.ellipse(0, 0, 2.5 * f.s + 1, 7 * f.s + 2, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(200,200,220,0.8)'; ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(0, -7 * f.s - 2); ctx.lineTo(0, 7 * f.s + 4); ctx.stroke();
          ctx.restore();
        }
        break;
      case 'digital':
        ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
        for (const f of this.list) {
          ctx.fillStyle = `rgba(0,255,200,${0.25 + f.s * 0.4})`;
          ctx.fillText(f.ch, f.x, f.y);
          ctx.fillStyle = `rgba(0,255,200,${0.12 * f.s})`;
          ctx.fillText(f.ch === '0' ? '1' : '0', f.x, f.y - 14);
        }
        break;
      case 'sparks':
        for (const f of this.list) {
          ctx.fillStyle = Math.sin(f.t * 20 + f.rot) > 0 ? '#ffd54a' : '#ff8a3d';
          ctx.fillRect(f.x, f.y, 2, 3);
        }
        break;
      case 'space':
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
        for (const f of this.list) {
          if (f.wait > 0) continue;
          const g = ctx.createLinearGradient(f.x, f.y, f.x - f.vx * 0.12, f.y - f.vy * 0.12);
          g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.strokeStyle = g;
          ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x - f.vx * 0.12, f.y - f.vy * 0.12); ctx.stroke();
        }
        break;
    }
  },
};

// Темнота: вокруг робота светлый круг
function drawDarkness(L, cam, t) {
  const p = Game.player;
  const px = p ? (p.x + p.w / 2 - cam.x) * scale : canvas.width / 2;
  const py = p ? (p.y + p.h / 2 - cam.y) * scale : canvas.height / 2;
  const r = (190 + Math.sin(t * 3) * 6) * scale;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createRadialGradient(px, py, r * 0.35, px, py, r);
  g.addColorStop(0, 'rgba(4,4,12,0)');
  g.addColorStop(1, 'rgba(4,4,12,0.94)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // светятся монеты и портал
  ctx.globalCompositeOperation = 'lighter';
  const glow = (x, y, rad, col) => {
    const sx = (x - cam.x) * scale, sy = (y - cam.y) * scale;
    if (sx < -100 || sx > canvas.width + 100 || sy < -100 || sy > canvas.height + 100) return;
    const gg = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad * scale);
    gg.addColorStop(0, col); gg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gg;
    ctx.fillRect(sx - rad * scale, sy - rad * scale, rad * 2 * scale, rad * 2 * scale);
  };
  for (const c of L.coins) if (!c.taken) glow(c.x + 8, c.y + 8, 22, 'rgba(255,200,60,0.35)');
  for (const k of L.checkpoints) glow(k.x + 8, k.y + 12, 40, k.active ? 'rgba(86,227,159,0.3)' : 'rgba(255,93,115,0.25)');
  if (L.goal && !L.goal.hidden) glow(L.goal.x + 16, L.goal.y + 30, 70, 'rgba(255,140,220,0.4)');
  for (const e of L.enemies) if (e.alive && (e.type === 'ghost' || e.type === 'swooper')) glow(e.x + e.w / 2, e.y + e.h / 2, 26, 'rgba(200,220,255,0.25)');
  ctx.globalCompositeOperation = 'source-over';
}
