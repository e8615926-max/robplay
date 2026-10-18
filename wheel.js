'use strict';

// ============================================================
//  Колесо фортуны: 3 бесплатные попытки в день
// ============================================================
const WHEEL_PRIZES = [
  { label: '10', coins: 10, color: '#3fa7e0', w: 20 },
  { label: '50', coins: 50, color: '#f0b72f', w: 12 },
  { label: '20', coins: 20, color: '#2fbf73', w: 18 },
  { label: 'СКИН', skin: true, color: '#e0559a', w: 4 },
  { label: '30', coins: 30, color: '#8a5ae0', w: 16 },
  { label: '100', coins: 100, color: '#ef7a2f', w: 7 },
  { label: '15', coins: 15, color: '#36b5c9', w: 20 },
  { label: '250', coins: 250, color: '#e0405a', w: 3 },
];
const WHEEL_SPINS = 3;

const Wheel = {
  rot: 0, from: 0, to: 0, spinT: -1, dur: 4.6, prize: null, bits: [], lastSeg: 0, open: false, t: 0,

  today() { return new Date().toDateString(); },
  spinsLeft() {
    const w = Save.data.wheel;
    if (!w || w.date !== this.today()) return WHEEL_SPINS;
    return w.left;
  },
  useSpin() {
    Save.data.wheel = { date: this.today(), left: this.spinsLeft() - 1 };
    Save.store();
  },

  show() {
    this.open = true;
    this.refresh();
  },
  refresh() {
    const left = this.spinsLeft();
    $('wheel-left').textContent = left;
    $('wheel-wallet').textContent = Save.data.wallet;
    const btn = $('btn-spin');
    btn.disabled = left <= 0 || this.spinT >= 0;
    btn.textContent = left > 0 ? `🎡 Крутить! (${left}/${WHEEL_SPINS})` : '⏳ Новые попытки завтра';
  },

  spin() {
    if (this.spinT >= 0 || this.spinsLeft() <= 0) return;
    Sound.init();
    this.useSpin();
    // выбираем приз по весам
    const total = WHEEL_PRIZES.reduce((s, p) => s + p.w, 0);
    let r = Math.random() * total, idx = 0;
    while (r >= WHEEL_PRIZES[idx].w) { r -= WHEEL_PRIZES[idx].w; idx++; }
    const seg = Math.PI * 2 / WHEEL_PRIZES.length;
    const target = -(idx + 0.5) * seg + rand(-0.3, 0.3) * seg;
    const cur = ((this.rot % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let delta = ((target - cur) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    this.from = this.rot;
    this.to = this.rot + Math.PI * 2 * 6 + delta;
    this.spinT = 0;
    this.prize = idx;
    $('wheel-result').textContent = '';
    Sound.play('spin');
    this.refresh();
  },

  award() {
    const p = WHEEL_PRIZES[this.prize];
    let text;
    if (p.skin) {
      const pool = SKINS.filter(s => !s.req && !Save.data.skins.includes(s.id));
      if (pool.length) {
        const s = pool[Math.floor(Math.random() * pool.length)];
        Save.data.skins.push(s.id);
        text = `🎉 Скин «${s.name}»!`;
      } else {
        Save.data.wallet += 200;
        text = '🎉 Все скины уже твои — держи 200 🪙!';
      }
    } else {
      Save.data.wallet += p.coins;
      Save.data.stats.coins += p.coins;
      text = `🎉 +${p.coins} 🪙`;
    }
    Save.store();
    $('wheel-result').textContent = text;
    Sound.play(p.coins >= 100 || p.skin ? 'jackpot' : 'win');
    for (let i = 0; i < 70; i++) {
      this.bits.push({ x: 160, y: 160, vx: rand(-260, 260), vy: rand(-380, -60), life: rand(1, 1.8), c: ['#ffd54a', '#ff7ac8', '#6fd3ff', '#56e39f'][i % 4], r: rand(0, 6) });
    }
    this.refresh();
  },

  update(dt) {
    if (!this.open) return;
    this.t += dt;
    if (this.spinT >= 0) {
      this.spinT += dt;
      const k = Math.min(1, this.spinT / this.dur);
      const e = 1 - Math.pow(1 - k, 4);
      this.rot = this.from + (this.to - this.from) * e;
      const seg = Math.PI * 2 / WHEEL_PRIZES.length;
      const s = Math.floor((this.rot + seg / 2) / seg);
      if (s !== this.lastSeg) { this.lastSeg = s; Sound.play('tick'); this.kick = 1; }
      if (k >= 1) { this.spinT = -1; this.award(); }
    }
    this.kick = Math.max(0, (this.kick || 0) - dt * 8);
    for (const b of this.bits) { b.vy += 600 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; b.r += dt * 8; }
    this.bits = this.bits.filter(b => b.life > 0);
    this.draw();
  },

  draw() {
    const cv = $('wheel-canvas'), c = cv.getContext('2d');
    const W = cv.width, R = W / 2 - 14, cx = W / 2, cy = W / 2;
    c.clearRect(0, 0, W, W);
    const n = WHEEL_PRIZES.length, seg = Math.PI * 2 / n;
    // внешнее кольцо с лампочками
    c.fillStyle = '#2a1745';
    c.beginPath(); c.arc(cx, cy, R + 12, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2;
      const on = (Math.floor(this.t * (this.spinT >= 0 ? 12 : 3)) + i) % 2 === 0;
      c.fillStyle = on ? '#ffe36b' : '#7a5a2a';
      c.beginPath(); c.arc(cx + Math.cos(a) * (R + 6), cy + Math.sin(a) * (R + 6), 3.5, 0, Math.PI * 2); c.fill();
    }
    c.save();
    c.translate(cx, cy);
    c.rotate(this.rot - Math.PI / 2);
    for (let i = 0; i < n; i++) {
      const p = WHEEL_PRIZES[i];
      c.fillStyle = p.color;
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, i * seg, (i + 1) * seg); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2; c.stroke();
      c.save();
      c.rotate((i + 0.5) * seg);
      c.fillStyle = '#fff';
      c.font = `bold ${p.skin ? 15 : 20}px system-ui, sans-serif`;
      c.textAlign = 'right'; c.textBaseline = 'middle';
      c.shadowColor = 'rgba(0,0,0,0.4)'; c.shadowBlur = 4;
      c.fillText(p.skin ? '🎨 СКИН' : `${p.label} 🪙`, R - 12, 0);
      c.restore();
    }
    c.restore();
    // центр
    const g = c.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, 26);
    g.addColorStop(0, '#fff6c2'); g.addColorStop(1, '#e0a020');
    c.fillStyle = g;
    c.beginPath(); c.arc(cx, cy, 24, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#7a4a10'; c.font = 'bold 13px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('ROB', cx, cy);
    // указатель
    c.save();
    c.translate(cx, 8);
    c.rotate((this.kick || 0) * -0.35);
    c.fillStyle = '#ff3d5a';
    c.beginPath(); c.moveTo(-12, -4); c.lineTo(12, -4); c.lineTo(0, 24); c.closePath(); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 2, 4, 0, Math.PI * 2); c.fill();
    c.restore();
    // конфетти
    for (const b of this.bits) {
      c.globalAlpha = Math.min(1, b.life);
      c.save(); c.translate(b.x, b.y); c.rotate(b.r);
      c.fillStyle = b.c; c.fillRect(-4, -2, 8, 4);
      c.restore();
    }
    c.globalAlpha = 1;
  },
};
