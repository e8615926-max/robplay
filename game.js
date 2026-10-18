'use strict';

// ============================================================
//  RobPlay — платформер о роботе
// ============================================================

const TILE = 32;
const VIEW_H = 15 * TILE;          // высота видимой области в мировых пикселях
const MIN_VIEW_W = 560;            // минимальная ширина обзора (для узких экранов)
const STEP = 1 / 120;              // фиксированный шаг физики

// Физика игрока
const GRAVITY = 2100, MAX_FALL = 900, RUN = 270;
const ACC_GROUND = 2600, DEC_GROUND = 3200, ACC_AIR = 1700;
const JUMP_V = 680, DJUMP_V = 600, WALL_JUMP_VX = 380, WALL_JUMP_VY = 640, WALL_SLIDE = 140;
const DASH_V = 660, DASH_T = 0.15, DASH_CD = 0.4;
const COYOTE = 0.1, BUFFER = 0.13, BOUNCE_V = 1080, STOMP_V = 560;
const CRUMBLE_DELAY = 0.45, CRUMBLE_RESPAWN = 3;

const THEMES = [
  { sky: ['#5ec8ff', '#d4f4ff'], ground: '#6b4a2b', top: '#4cd964', topDark: '#2e9a4a', mount: '#86bfe0', mount2: '#a9d6ee', far: 'clouds', fx: 'leaves' },
  { sky: ['#ff8f57', '#ffe3a8'], ground: '#9c6b3c', top: '#f1c56e', topDark: '#b88a3a', mount: '#d98c5f', mount2: '#eaae7c', far: 'clouds', fx: 'sand' },
  { sky: ['#141a36', '#3a4a7a'], ground: '#3b4566', top: '#7ad7ff', topDark: '#3d8fb8', mount: '#232c52', mount2: '#2d3864', far: 'stars', fx: 'fireflies' },
  { sky: ['#8e7cff', '#ffb8e8'], ground: '#5d4b8a', top: '#ff7ac8', topDark: '#c04f95', mount: '#a58ff5', mount2: '#c3aefc', far: 'clouds', fx: 'petals' },
  { sky: ['#070b24', '#24346f'], ground: '#2b3150', top: '#56e39f', topDark: '#2a9a68', mount: '#141c45', mount2: '#1d2858', far: 'stars', fx: 'fireflies' },
  { sky: ['#1f0816', '#7a2626'], ground: '#3a2a33', top: '#ff8a3d', topDark: '#b24a1a', mount: '#3b1220', mount2: '#541a28', far: 'embers', fx: 'embers' },
  { sky: ['#26323e', '#58707f'], ground: '#3d3a2e', top: '#5fae4e', topDark: '#3b7a34', mount: '#2c3e45', mount2: '#3a5059', far: 'clouds', fx: 'rain', noSun: true },
  { sky: ['#9fc4e8', '#eef6ff'], ground: '#5a6f8a', top: '#ffffff', topDark: '#b8d4ee', mount: '#c2d6ec', mount2: '#dbe8f6', far: 'clouds', fx: 'snow' },
  { sky: ['#e8a85a', '#f6dca0'], ground: '#a8743f', top: '#e9c27a', topDark: '#c0924c', mount: '#d69a5c', mount2: '#e6b679', far: 'clouds', fx: 'sandstorm' },
  { sky: ['#0a3150', '#1d7a8c'], ground: '#2d4a5a', top: '#4fd1c5', topDark: '#2a8f87', mount: '#0f4a66', mount2: '#155a78', far: 'none', fx: 'bubbles' },
  { sky: ['#15161c', '#2e303c'], ground: '#3a3d4a', top: '#ffb347', topDark: '#b8742a', mount: '#1d1f28', mount2: '#25283a', far: 'none', fx: 'sparks' },
  { sky: ['#05030f', '#1b1440'], ground: '#3a3550', top: '#c08cff', topDark: '#7a4fc0', mount: '#120c2a', mount2: '#1a1238', far: 'stars', fx: 'space' },
  { sky: ['#6fb8ff', '#ffe6c2'], ground: '#c9a35a', top: '#ffffff', topDark: '#f0d9a0', mount: '#fdf3e4', mount2: '#ffffff', far: 'clouds', fx: 'feathers' },
  { sky: ['#01040c', '#062033'], ground: '#0b1a2a', top: '#00ffc8', topDark: '#00a080', mount: '#061c2a', mount2: '#08263a', far: 'stars', fx: 'digital' },
];

// ---------- Утилиты ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const approach = (v, target, d) => v < target ? Math.min(v + d, target) : Math.max(v - d, target);
const rand = (a, b) => a + Math.random() * (b - a);
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const fmtTime = t => {
  const m = Math.floor(t / 60), s = t - m * 60;
  return m > 0 ? `${m}:${s.toFixed(1).padStart(4, '0')}` : s.toFixed(1);
};
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------- Сохранение ----------
const Save = {
  data: {
    unlocked: 1, best: {}, muted: false, music: true,
    wallet: 0, skin: 'classic', skins: ['classic'], champion: false,
    sfxVol: 1, musicVol: 1, shake: true, wheel: null, lang: null, menuStyle: 'neon',
    abil: { equipped: 'dash', lv: { dash: 1 }, pas: {} },
    stats: { coins: 0, deaths: 0, kills: 0, bosses: 0, time: 0, completed: 0 },
  },
  load() {
    try {
      const d = JSON.parse(localStorage.getItem('robplay-save'));
      if (d) {
        const stats = Object.assign({}, this.data.stats, d.stats);
        Object.assign(this.data, d);
        this.data.stats = stats;
      }
    } catch (e) { /* хранилище недоступно */ }
  },
  store() {
    try { localStorage.setItem('robplay-save', JSON.stringify(this.data)); } catch (e) { /* ignore */ }
  },
};

// ---------- Звук (синтез через WebAudio) ----------
const midi = n => 440 * Math.pow(2, (n - 69) / 12);

// Музыкальные темы: аккорды, темп, мелодия, инструменты, ударные
const TRACKS = {
  menu: {
    eighth: 0.2, arpType: 'triangle', leadType: 'square', bassType: 'sawtooth', drums: true,
    chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]],
    lead: [76, 0, 74, 72, 0, 72, 74, 0, 72, 0, 69, 0, 72, 74, 76, 0, 79, 0, 76, 74, 0, 72, 74, 0, 74, 0, 71, 0, 74, 0, 67, 0],
  },
  w1: {
    eighth: 0.22, arpType: 'triangle', leadType: 'square', bassType: 'sine', drums: true,
    chords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]],
    lead: [72, 0, 76, 79, 0, 76, 72, 0, 74, 0, 79, 0, 74, 71, 67, 0, 72, 76, 0, 72, 69, 0, 72, 0, 77, 0, 76, 74, 72, 0, 0, 0],
  },
  w2: {
    eighth: 0.2, arpType: 'square', leadType: 'triangle', bassType: 'sawtooth', drums: true,
    chords: [[62, 65, 69], [58, 62, 65], [53, 57, 60], [60, 64, 67]],
    lead: [74, 0, 77, 0, 81, 79, 77, 0, 74, 0, 70, 0, 74, 77, 0, 0, 72, 0, 77, 76, 74, 0, 72, 0, 76, 0, 79, 0, 76, 72, 0, 0],
  },
  w4: {
    eighth: 0.21, arpType: 'triangle', leadType: 'triangle', bassType: 'sine', drums: true,
    chords: [[65, 69, 72], [60, 64, 67], [62, 65, 69], [58, 62, 65]],
    lead: [77, 0, 81, 0, 84, 81, 79, 0, 76, 0, 79, 0, 81, 79, 77, 0, 74, 0, 77, 81, 79, 0, 77, 0, 74, 0, 70, 74, 77, 0, 0, 0],
  },
  w5: {
    eighth: 0.16, arpType: 'sawtooth', leadType: 'square', bassType: 'square', drums: true,
    chords: [[60, 63, 67], [56, 60, 63], [63, 67, 70], [58, 62, 65]],
    lead: [72, 75, 79, 0, 75, 72, 0, 0, 68, 72, 75, 0, 80, 79, 75, 0, 75, 79, 82, 0, 79, 75, 0, 0, 70, 74, 77, 0, 82, 0, 77, 0],
  },
  w3: {
    eighth: 0.18, arpType: 'sawtooth', leadType: 'square', bassType: 'sawtooth', drums: true,
    chords: [[64, 67, 71], [60, 64, 67], [57, 60, 64], [59, 63, 66]],
    lead: [76, 0, 79, 76, 83, 0, 79, 0, 72, 0, 76, 79, 76, 0, 72, 0, 69, 0, 72, 76, 81, 0, 76, 0, 71, 0, 75, 78, 83, 0, 78, 0],
  },
  boss: {
    eighth: 0.16, arpType: 'sawtooth', leadType: 'square', bassType: 'square', drums: true, heavy: true,
    chords: [[57, 60, 64], [58, 62, 65], [55, 58, 62], [56, 59, 64]],
    lead: [81, 0, 81, 79, 81, 0, 84, 0, 82, 0, 81, 79, 77, 0, 79, 0, 79, 0, 77, 76, 74, 0, 76, 0, 80, 0, 83, 0, 88, 0, 0, 0],
  },
  story: {
    eighth: 0.3, arpType: 'sine', leadType: 'triangle', bassType: 'sine', drums: false,
    chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]],
    lead: [76, 0, 0, 72, 0, 0, 74, 0, 72, 0, 0, 69, 0, 0, 0, 0, 74, 0, 0, 77, 0, 0, 76, 0, 71, 0, 0, 68, 0, 0, 0, 0],
  },
};

// Фоновые звуки окружения по эффекту карты
const AMBIENT = {
  rain: { type: 'bandpass', freq: 1400, q: 0.6, vol: 0.12 },
  snow: { type: 'lowpass', freq: 500, q: 1, vol: 0.08, wobble: true },
  sandstorm: { type: 'bandpass', freq: 700, q: 0.8, vol: 0.14, wobble: true },
  bubbles: { type: 'lowpass', freq: 260, q: 2, vol: 0.12, wobble: true },
  embers: { type: 'lowpass', freq: 140, q: 3, vol: 0.18 },
  sparks: { type: 'lowpass', freq: 200, q: 6, vol: 0.06 },
  digital: { type: 'bandpass', freq: 3000, q: 8, vol: 0.03, wobble: true },
  feathers: { type: 'lowpass', freq: 600, q: 1, vol: 0.07, wobble: true },
  fireflies: { type: 'highpass', freq: 5000, q: 1, vol: 0.015 },
};

const Sound = {
  ctx: null, master: null, sfxBus: null, musicBus: null, ambBus: null,
  step: 0, nextTime: 0, timer: null, track: 'menu', amb: null, ambKind: null,
  lastStep: 0, noiseBuf: null,

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    // мягкий компрессор, чтобы звуки не перегружали друг друга
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp); comp.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain(); this.sfxBus.connect(this.master);
    this.musicBus = this.ctx.createGain(); this.musicBus.connect(this.master);
    this.ambBus = this.ctx.createGain(); this.ambBus.connect(this.master);
    const len = this.ctx.sampleRate * 2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.apply();
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 25);
    if (this.ambKind) { const k = this.ambKind; this.ambKind = null; this.setAmbient(k); }
  },

  apply() {
    if (!this.ctx) return;
    this.master.gain.value = Save.data.muted ? 0 : 1;
    this.sfxBus.gain.value = 0.5 * Save.data.sfxVol;
    this.ambBus.gain.value = Save.data.sfxVol;
    this.musicBus.gain.value = Save.data.music ? 0.11 * Save.data.musicVol : 0;
  },

  setTrack(name) {
    if (this.track === name) return;
    this.track = name;
    this.step = 0;
  },

  setAmbient(kind) {
    if (!this.ctx) { this.ambKind = kind; return; }
    if (this.ambKind === kind) return;
    this.ambKind = kind;
    if (this.amb) {
      const old = this.amb;
      old.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
      setTimeout(() => { try { old.src.stop(); } catch (e) { /* ignore */ } }, 1500);
      this.amb = null;
    }
    const a = AMBIENT[kind];
    if (!a) return;
    const c = this.ctx;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = a.type; f.frequency.value = a.freq; f.Q.value = a.q;
    const g = c.createGain(); g.gain.value = 0;
    g.gain.setTargetAtTime(a.vol, c.currentTime, 0.5);
    src.connect(f); f.connect(g); g.connect(this.ambBus);
    if (a.wobble) {
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = 0.15; lg.gain.value = a.freq * 0.4;
      lfo.connect(lg); lg.connect(f.frequency); lfo.start();
    }
    src.start();
    this.amb = { src, g };
  },

  tone(freq, dur, type = 'square', vol = 0.3, slideTo = 0, delay = 0, bus = this.sfxBus, at = 0) {
    const c = this.ctx;
    const t = (at || c.currentTime) + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.05);
  },

  noise(dur, vol = 0.3, freq = 1200, delay = 0, bus = this.sfxBus, at = 0, type = 'lowpass') {
    const c = this.ctx, t = (at || c.currentTime) + delay;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t, Math.random() * 1.5, dur + 0.05);
  },

  play(name, k = 1) {
    if (!this.ctx || Save.data.muted) return;
    switch (name) {
      case 'jump': this.tone(320, 0.14, 'square', 0.16, 640); break;
      case 'djump': this.tone(480, 0.16, 'square', 0.14, 980); this.tone(720, 0.1, 'sine', 0.1, 1400, 0.03); break;
      case 'walljump': this.tone(380, 0.12, 'square', 0.15, 760); this.noise(0.06, 0.15, 3000); break;
      case 'coin': {
        const p = Math.min(2, 1 + (k - 1) * 0.06);   // каждая следующая монета выше
        this.tone(988 * p, 0.08, 'square', 0.12); this.tone(1319 * p, 0.22, 'square', 0.12, 0, 0.07);
        break;
      }
      case 'stomp': this.tone(220, 0.15, 'square', 0.22, 90); this.noise(0.1, 0.25, 900); break;
      case 'dash': this.noise(0.2, 0.3, 2600, 0, this.sfxBus, 0, 'bandpass'); this.tone(200, 0.18, 'sawtooth', 0.08, 600); break;
      case 'bounce': this.tone(180, 0.3, 'sine', 0.32, 720); this.tone(360, 0.2, 'triangle', 0.1, 1440, 0.05); break;
      case 'crumble': this.noise(0.3, 0.25, 600); this.tone(120, 0.2, 'triangle', 0.1, 60); break;
      case 'checkpoint': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.22, 0, i * 0.07)); break;
      case 'death': this.tone(440, 0.5, 'sawtooth', 0.2, 60); this.noise(0.35, 0.3, 1500); break;
      case 'win': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.25, 'square', 0.14, 0, i * 0.1)); break;
      case 'jackpot': [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, 0.3, 'square', 0.13, 0, i * 0.07)); this.noise(0.6, 0.15, 6000, 0.4, this.sfxBus, 0, 'highpass'); break;
      case 'click': this.tone(660, 0.05, 'square', 0.08); break;
      case 'hover': this.tone(1200, 0.03, 'sine', 0.04); break;
      case 'blip': this.tone(520 + Math.random() * 120, 0.04, 'square', 0.04); break;
      case 'step': this.noise(0.04, 0.06, 2500, 0, this.sfxBus, 0, 'highpass'); break;
      case 'land': this.noise(0.08, 0.12, 700); this.tone(120, 0.08, 'sine', 0.12, 70); break;
      case 'shoot': this.tone(520, 0.12, 'square', 0.1, 180); break;
      case 'swoop': this.tone(900, 0.25, 'sine', 0.1, 300); break;
      case 'thud': this.tone(110, 0.25, 'sine', 0.38, 40); this.noise(0.2, 0.28, 400); break;
      case 'boom': this.noise(0.4, 0.35, 700); this.tone(90, 0.35, 'sine', 0.3, 35); break;
      case 'thunder': this.noise(1.6, 0.4, 260); this.tone(50, 1.2, 'sine', 0.2, 30); break;
      case 'summon': this.tone(300, 0.4, 'sawtooth', 0.1, 900); this.tone(450, 0.4, 'sine', 0.08, 1350, 0.1); break;
      case 'bossJump': this.tone(140, 0.3, 'square', 0.18, 280); break;
      case 'bossHit': this.tone(180, 0.2, 'square', 0.28, 60); this.noise(0.15, 0.3, 2000); break;
      case 'bossDie': [784, 659, 523, 392, 523, 784, 1047].forEach((f, i) => this.tone(f, 0.3, 'square', 0.14, 0, i * 0.12)); this.noise(1, 0.3, 800); break;
      case 'croak': this.tone(180, 0.12, 'square', 0.08, 120); this.tone(150, 0.1, 'square', 0.06, 100, 0.12); break;
      case 'snort': this.noise(0.25, 0.2, 500, 0, this.sfxBus, 0, 'bandpass'); this.tone(90, 0.2, 'sawtooth', 0.08, 60); break;
      case 'woo': this.tone(300, 0.7, 'sine', 0.07, 200); this.tone(306, 0.7, 'sine', 0.05, 205); break;
      case 'hiss': this.noise(0.3, 0.08, 5000, 0, this.sfxBus, 0, 'highpass'); break;
      case 'kick': this.tone(260, 0.1, 'square', 0.18, 520); this.noise(0.05, 0.2, 2000); break;
      case 'squish': this.tone(400, 0.2, 'sine', 0.18, 120); this.noise(0.1, 0.15, 800); break;
      case 'throw': this.noise(0.12, 0.12, 1500, 0, this.sfxBus, 0, 'bandpass'); break;
      case 'launch': this.noise(0.4, 0.2, 1200); this.tone(200, 0.4, 'sawtooth', 0.06, 500); break;
      case 'powerup': [523, 784, 659, 1047, 784, 1319].forEach((f, i) => this.tone(f, 0.12, 'square', 0.12, 0, i * 0.05)); break;
      case 'powerdown': this.tone(784, 0.3, 'triangle', 0.12, 260); break;
      case 'shieldBreak': this.noise(0.3, 0.3, 4000, 0, this.sfxBus, 0, 'highpass'); this.tone(1400, 0.3, 'triangle', 0.15, 300); break;
      case 'spin': this.tone(300, 0.5, 'sawtooth', 0.06, 900); break;
      case 'tick': this.tone(1800, 0.025, 'square', 0.06); break;
      case 'firework': this.noise(0.5, 0.18, 2500, 0.05); this.tone(1200, 0.4, 'sine', 0.05, 300); break;
      case 'error': this.tone(200, 0.15, 'square', 0.12, 140); this.tone(150, 0.2, 'square', 0.12, 100, 0.1); break;
      case 'hurt': this.tone(500, 0.2, 'sawtooth', 0.15, 200); this.noise(0.12, 0.2, 1500); break;
      case 'laser': this.tone(1400, 0.12, 'square', 0.08, 500); this.tone(900, 0.1, 'sawtooth', 0.05, 300); break;
      case 'blink': this.tone(600, 0.15, 'sine', 0.15, 1800); this.noise(0.12, 0.08, 6000, 0, this.sfxBus, 0, 'highpass'); break;
      case 'poundStart': this.tone(700, 0.12, 'square', 0.1, 1100); break;
      case 'ding': this.tone(2200, 0.12, 'triangle', 0.08); break;
      case 'laserCharge': this.tone(200, 0.9, 'sawtooth', 0.06, 1200); break;
      case 'laserFire': this.noise(0.6, 0.3, 3000, 0, this.sfxBus, 0, 'bandpass'); this.tone(120, 0.6, 'sawtooth', 0.15, 80); break;
      case 'roar': this.tone(120, 0.6, 'sawtooth', 0.18, 60); this.noise(0.5, 0.2, 600); break;
      case 'buy': this.tone(1319, 0.08, 'square', 0.12); this.tone(1760, 0.2, 'square', 0.12, 0, 0.08); this.noise(0.15, 0.1, 6000, 0.05, this.sfxBus, 0, 'highpass'); break;
    }
  },

  // Секвенсор фоновой музыки
  schedule() {
    const c = this.ctx;
    const tr = TRACKS[this.track] || TRACKS.menu;
    const arp = [0, 1, 2, 1, 0, 2, 1, 2];
    while (this.nextTime < c.currentTime + 0.12) {
      const s = this.step, t = this.nextTime;
      const chord = tr.chords[Math.floor(s / 8) % 4];
      this.tone(midi(chord[arp[s % 8]] + 12), tr.eighth * 0.9, tr.arpType, tr.arpType === 'sawtooth' ? 0.22 : 0.45, 0, 0, this.musicBus, t);
      if (s % 4 === 0) this.tone(midi(chord[0] - 12), tr.eighth * 1.9, tr.bassType, tr.bassType === 'sine' ? 0.9 : 0.35, 0, 0, this.musicBus, t);
      if (tr.heavy && s % 2 === 1) this.tone(midi(chord[0] - 12), tr.eighth * 0.8, 'square', 0.2, 0, 0, this.musicBus, t);
      const ln = tr.lead[s % 32];
      if (ln && Math.floor(s / 32) % 2 === 1) this.tone(midi(ln), tr.eighth * 1.1, tr.leadType, 0.16, 0, 0, this.musicBus, t);
      if (tr.drums) {
        if (s % 4 === 0) this.tone(150, 0.12, 'sine', 0.9, 45, 0, this.musicBus, t);
        if (s % 8 === 4) this.noise(0.12, 0.35, 1800, 0, this.musicBus, t, 'bandpass');
        if (s % 2 === 1) this.noise(0.03, 0.18, 7000, 0, this.musicBus, t, 'highpass');
      }
      this.step++;
      this.nextTime += tr.eighth;
    }
  },
};

// ---------- Ввод ----------
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyZ: 'jump',
  ShiftLeft: 'dash', ShiftRight: 'dash', KeyX: 'dash', KeyJ: 'dash',
};
const Input = {
  keys: {}, touch: {}, pad: {}, latch: {}, prev: {}, cur: {},
  is(a) { return !!this.cur[a]; },
  pressed(a) { return !!this.cur[a + 'Pressed']; },
  poll() {
    this.pad = {};
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp) continue;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, b = i => gp.buttons[i] && gp.buttons[i].pressed;
      if (ax < -0.4 || b(14)) this.pad.left = true;
      if (ax > 0.4 || b(15)) this.pad.right = true;
      if (ay > 0.6 || b(13)) this.pad.down = true;
      if (b(0) || b(3)) this.pad.jump = true;
      if (b(2) || b(1) || b(5) || b(7)) this.pad.dash = true;
      if (b(9)) this.pad.pause = true;
    }
  },
  update() {
    this.poll();
    const next = {};
    for (const a of ['left', 'right', 'down', 'jump', 'dash', 'pause']) {
      const held = !!(this.keys[a] || this.touch[a] || this.pad[a]);
      next[a] = held;
      next[a + 'Pressed'] = !!this.latch[a] || (held && !this.prev[a]);
    }
    this.prev = { left: next.left, right: next.right, down: next.down, jump: next.jump, dash: next.dash, pause: next.pause };
    this.latch = {};
    this.cur = next;
  },
};

// ============================================================
//  Уровень
// ============================================================
const SOLID = { '#': 1, 'B': 1, 'X': 1 };

class Level {
  constructor(index) {
    const def = LEVELS[index];
    this.index = index;
    this.def = def;
    this.theme = THEMES[def.theme % THEMES.length];
    this.rows = def.map.length;
    this.cols = Math.max(...def.map.map(r => r.length));
    this.w = this.cols * TILE;
    this.h = this.rows * TILE;
    this.grid = [];
    this.coins = []; this.enemies = []; this.platforms = []; this.checkpoints = [];
    this.crumbles = new Map();
    this.goal = null;
    this.boss = null;
    this.bullets = [];
    this.pbullets = [];
    this.powerups = [];
    this.start = { x: TILE, y: TILE };
    this.ice = !!def.ice;
    this.lowGrav = !!def.lowGrav;
    this.dark = !!def.dark;

    for (let y = 0; y < this.rows; y++) {
      const row = def.map[y].padEnd(this.cols, ' ').split('');
      for (let x = 0; x < this.cols; x++) {
        const c = row[x], px = x * TILE, py = y * TILE;
        switch (c) {
          case 'P': this.start = { x: px, y: py }; row[x] = ' '; break;
          case 'C': this.coins.push({ x: px + 8, y: py + 8, w: 16, h: 16, taken: false, phase: Math.random() * 6 }); row[x] = ' '; break;
          case 'E': case 'F': case 'S': case 'J': case 'H': case 'T': case 'W': case 'Q': case 'O': case 'D':
          case 'N': case 'Y': case 'U': case 'A': case 'R':
            this.enemies.push(makeEnemy(c, px, py)); row[x] = ' '; break;
          case 'Z': this.boss = makeBoss(def.boss || 1, px, py); row[x] = ' '; break;
          case '!': case '&': case '*': this.powerups.push(makePowerup(c, px, py)); row[x] = ' '; break;
          case 'K': this.checkpoints.push({ x: px + 8, y: py - 32, w: 16, h: 64, active: false }); row[x] = ' '; break;
          case 'G': this.goal = { x: px, y: py - 32, w: 32, h: 64 }; row[x] = ' '; break;
          case 'M': case 'V':
            this.platforms.push({ axis: c === 'M' ? 'x' : 'y', x0: px - TILE, y0: py, x: px - TILE, y: py, w: TILE * 3, h: 14,
              range: TILE * 3, speed: 1.1, phase: Math.random() * 6, dx: 0, dy: 0 });
            row[x] = ' ';
            break;
        }
        if (c === 'X') this.crumbles.set(y * this.cols + x, { t: -1, broken: false, respawn: 0 });
      }
      this.grid.push(row);
    }
    if (this.boss && this.goal) this.goal.hidden = true;
    this.coinsTotal = this.coins.length;
    this.bonus = 0;
    this.props = buildProps(this);
    this.time = 0;
    this.deaths = 0;
    this.respawnPoint = { ...this.start };
  }

  tile(tx, ty) {
    if (ty < 0 || ty >= this.rows || tx < 0 || tx >= this.cols) return ' ';
    return this.grid[ty][tx];
  }

  solid(tx, ty) {
    if (tx < 0 || tx >= this.cols) return true;       // края уровня — стены
    if (ty < 0 || ty >= this.rows) return false;
    const c = this.grid[ty][tx];
    if (!SOLID[c]) return false;
    if (c === 'X') return !this.crumbles.get(ty * this.cols + tx).broken;
    return true;
  }

  get coinsTaken() { return this.coins.filter(c => c.taken).length; }
}

// ============================================================
//  Игра
// ============================================================
const canvas = document.getElementById('game');
let ctx = canvas.getContext('2d');
let dpr = 1, scale = 1, viewW = 800, viewH = VIEW_H;

const Game = {
  state: 'menu',      // menu | playing | paused | complete
  level: null,
  player: null,
  particles: [],
  cam: { x: 0, y: 0 },
  shake: 0,
  flash: 0,
  lightning: 0,
  texts: [],
  rings: [],
  coinCombo: 0, coinT: 0,
  iris: 1,
  menuT: 0,
  timeScale: 1,
};

function makePlayer(x, y) {
  return {
    x: x + (TILE - 22) / 2, y: y + TILE - 28, w: 22, h: 28,
    vx: 0, vy: 0, face: 1,
    onGround: false, wasGround: false, coyote: 0, buffer: 0, jumps: airJumps(),
    airDashes: maxAirDashes(), hp: maxHearts(), maxHp: maxHearts(), pound: false, gliding: false,
    wallDir: 0, wallLock: 0, sliding: false,
    dashT: 0, dashCD: 0, canDash: true, dashDir: 1,
    standOn: null, bounced: false,
    dead: false, deadT: 0, spawnT: 0.5,
    sx: 1, sy: 1, runPhase: 0, blinkT: 2, trail: [],
  };
}

// ---------- Частицы ----------
function emit(x, y, n, opt = {}) {
  for (let i = 0; i < n; i++) {
    const a = opt.angle != null ? opt.angle + rand(-opt.spread || 0, opt.spread || 0) : rand(0, Math.PI * 2);
    const sp = rand(opt.speedMin ?? 40, opt.speed ?? 200);
    const life = rand(0.3, opt.life ?? 0.7);
    Game.particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life, max: life,
      size: rand(opt.sizeMin ?? 2, opt.size ?? 4), color: Array.isArray(opt.color) ? opt.color[i % opt.color.length] : (opt.color || '#fff'),
      grav: opt.grav ?? 600, shape: opt.shape || 'sq',
    });
  }
}
function floatText(x, y, text, color = '#ffd54a', icon = null) {
  Game.texts.push({ x, y, text, color, icon, life: 1 });
}
function updateParticles(dt) {
  for (let i = Game.texts.length - 1; i >= 0; i--) {
    const f = Game.texts[i];
    f.life -= dt; f.y -= 40 * dt;
    if (f.life <= 0) Game.texts.splice(i, 1);
  }
  Game.iris = Math.min(1, Game.iris + dt * 2.2);
  updateRings(dt);
  const ps = Game.particles;
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    p.life -= dt;
    if (p.life <= 0) { ps.splice(i, 1); continue; }
    p.vy += p.grav * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 0.99;
  }
}

// ---------- Управление уровнями ----------
function startLevel(i) {
  Game.level = new Level(i);
  Game.player = makePlayer(Game.level.start.x, Game.level.start.y);
  Game.particles = [];
  Game.texts = [];
  Game.shake = 0;
  Game.lightning = 0;
  Game.iris = 0;
  snapCamera();
  Weather.init(Game.level);
  Sound.setTrack(LEVELS[i].boss ? 'boss' : ['w1', 'w2', 'w3', 'w4', 'w5'][Math.min(4, Math.floor(i / 10))]);
  Sound.setAmbient(Game.level.def.theme === 5 ? 'embers' : Game.level.theme.fx);
  Game.rings = [];
  Game.coinCombo = 0; Game.coinT = 0;
  setState('playing');
  UI.updateHud(true);
  UI.updateBoss(Game.level.boss);
  UI.toast(`<span class="t-title">${i + 1}. ${levelName(i)}</span>${levelTip(i)}`, 5200);
}

function respawn() {
  const L = Game.level;
  Game.player = makePlayer(L.respawnPoint.x, L.respawnPoint.y);
  L.bullets.length = 0;
  resetBossAfterDeath(L, L.boss);
  emit(Game.player.x + 11, Game.player.y + 14, 18, { color: ['#6fd3ff', '#fff'], grav: 0, speed: 160, life: 0.5 });
}

function killPlayer(cause) {
  const p = Game.player;
  if (p.dead) return;
  if (cause !== 'fall') {
    if (p.star > 0) return;
    if (p.hp > 1) {
      p.hp--;
      p.spawnT = 1.3;
      p.vy = -360; p.vx = -p.face * 220; p.wallLock = 0.2; p.pound = false;
      Sound.play('hurt');
      Game.shake = Math.max(Game.shake, 6);
      Game.flash = 0.18;
      emit(p.x + p.w / 2, p.y + p.h / 2, 14, { color: ['#ff4d6d', '#ffffff'], speed: 220, life: 0.5 });
      UI.updateHud();
      return;
    }
    if (p.shield) {
      p.shield = false;
      p.spawnT = 1.2;
      p.vy = -380;
      Sound.play('shieldBreak');
      Game.shake = Math.max(Game.shake, 6);
      emit(p.x + p.w / 2, p.y + p.h / 2, 24, { color: ['#6fd3ff', '#ffffff'], speed: 280, grav: 0, life: 0.5 });
      ring(p.x + p.w / 2, p.y + p.h / 2, '#6fd3ff', 50);
      return;
    }
  }
  p.dead = true;
  p.deadT = 0.9;
  Game.level.deaths++;
  Save.data.stats.deaths++;
  if (p.y > Game.level.h - 40 && LIQUID[Game.level.def.theme]) {
    const col = LIQUID_COLORS[LIQUID[Game.level.def.theme]];
    emit(p.x + p.w / 2, Game.level.h - 20, 24, { color: col, angle: -Math.PI / 2, spread: 0.9, speed: 380, life: 0.8 });
  }
  Game.shake = 12;
  Game.flash = 0.35;
  emit(p.x + p.w / 2, p.y + p.h / 2, 34, { color: ['#6fd3ff', '#e8f6ff', '#ffd54a', '#5a6a9a'], speed: 420, size: 6, life: 1 });
  Sound.play('death');
  UI.updateHud();
}

function completeLevel() {
  const L = Game.level;
  const i = L.index;
  const allCoins = L.coinsTaken === L.coinsTotal;
  const fast = L.time <= L.def.par;
  const stars = 1 + (allCoins ? 1 : 0) + (fast ? 1 : 0);
  const prev = Save.data.best[i];
  const newTime = !prev || L.time < prev.time;
  Save.data.best[i] = {
    time: prev ? Math.min(prev.time, L.time) : L.time,
    stars: Math.max(prev ? prev.stars : 0, stars),
  };
  Save.data.unlocked = Math.max(Save.data.unlocked, Math.min(LEVELS.length, i + 2));
  // монеты в копилку: собранные + бонус за врагов + за звёзды + за босса
  const reward = L.coinsTaken + L.bonus + stars * 5 + (L.boss ? 50 : 0);
  Save.data.wallet += reward;
  const st = Save.data.stats;
  st.coins += reward; st.completed++; st.time += L.time;
  if (i === LEVELS.length - 1) Save.data.champion = true;
  Save.store();
  Sound.play('win');
  const g = L.goal;
  for (let k = 0; k < 4; k++) {
    emit(g.x + 16, g.y + 10, 30, { color: ['#ffd54a', '#ff7ac8', '#6fd3ff', '#56e39f'], speed: 520, size: 6, life: 1.6, grav: 500 });
  }
  setState('complete');
  UI.hideToast();
  UI.showComplete({ stars, allCoins, fast, newTime, reward });
}

// ============================================================
//  Физика игрока
// ============================================================
function touchingWall(p, d) {
  const L = Game.level;
  const x = d < 0 ? p.x - 1 : p.x + p.w + 1;
  const tx = Math.floor(x / TILE);
  return L.solid(tx, Math.floor((p.y + 4) / TILE)) || L.solid(tx, Math.floor((p.y + p.h - 4) / TILE));
}

function moveX(p, dt) {
  const L = Game.level;
  p.x += p.vx * dt;
  const t0 = Math.floor(p.y / TILE), t1 = Math.floor((p.y + p.h - 0.01) / TILE);
  if (p.vx > 0) {
    const tx = Math.floor((p.x + p.w) / TILE);
    for (let ty = t0; ty <= t1; ty++) if (L.solid(tx, ty)) { p.x = tx * TILE - p.w; p.vx = 0; return true; }
  } else if (p.vx < 0) {
    const tx = Math.floor(p.x / TILE);
    for (let ty = t0; ty <= t1; ty++) if (L.solid(tx, ty)) { p.x = (tx + 1) * TILE; p.vx = 0; return true; }
  }
  return false;
}

function moveY(p, dt, canDrop) {
  const L = Game.level;
  const prevBottom = p.y + p.h;
  p.y += p.vy * dt;
  p.onGround = false;
  p.standOn = null;
  const l = Math.floor(p.x / TILE), r = Math.floor((p.x + p.w - 0.01) / TILE);
  if (p.vy >= 0) {
    const ty = Math.floor((p.y + p.h) / TILE);
    for (let tx = l; tx <= r; tx++) {
      const c = L.tile(tx, ty);
      const oneWay = c === '=' && prevBottom <= ty * TILE + 0.5 && !canDrop;
      if (L.solid(tx, ty) || oneWay) {
        p.y = ty * TILE - p.h;
        p.vy = 0;
        p.onGround = true;
        land(p, tx, ty, c);
        break;
      }
    }
    if (!p.onGround) {
      for (const pl of L.platforms) {
        if (prevBottom <= pl.y + 1 && p.y + p.h >= pl.y && p.x + p.w > pl.x && p.x < pl.x + pl.w) {
          p.y = pl.y - p.h; p.vy = 0; p.onGround = true; p.standOn = pl;
          land(p);
          break;
        }
      }
    }
  } else {
    const ty = Math.floor(p.y / TILE);
    for (let tx = l; tx <= r; tx++) {
      if (L.solid(tx, ty)) { p.y = (ty + 1) * TILE; p.vy = 0; break; }
    }
  }
}

function land(p, tx, ty, c) {
  const L = Game.level;
  if (p.pound) poundImpact(p);
  if (c === 'B') {
    p.vy = -BOUNCE_V; p.onGround = false; p.bounced = true;
    p.jumps = airJumps(); refillAbility(p); p.sx = 0.7; p.sy = 1.35;
    L.bounceAnim = { tx, ty, t: 0.3 };
    emit(tx * TILE + 16, ty * TILE, 14, { color: ['#ffd54a', '#fff'], angle: -Math.PI / 2, spread: 1, speed: 300 });
    Sound.play('bounce');
    return;
  }
  if (c === 'X') {
    const cr = L.crumbles.get(ty * L.cols + tx);
    if (cr.t < 0 && !cr.broken) { cr.t = CRUMBLE_DELAY; Sound.play('crumble'); }
  }
  if (!p.wasGround && !p.dead) {
    p.sx = 1.25; p.sy = 0.78;
    Sound.play('land');
    emit(p.x + p.w / 2, p.y + p.h, 6, { color: '#ffffffaa', angle: -Math.PI / 2, spread: 1.4, speed: 90, grav: 200, life: 0.35 });
  }
  p.bounced = false;
}

function updatePlayer(p, dt) {
  const L = Game.level;
  if (p.dead) {
    p.deadT -= dt;
    if (p.deadT <= 0) respawn();
    return;
  }
  p.spawnT = Math.max(0, p.spawnT - dt);

  const dir = (Input.is('right') ? 1 : 0) - (Input.is('left') ? 1 : 0);
  p.buffer = Input.pressed('jump') ? BUFFER : Math.max(0, p.buffer - dt);
  p.coyote = p.onGround ? COYOTE : Math.max(0, p.coyote - dt);
  p.wallLock = Math.max(0, p.wallLock - dt);
  p.dashCD = Math.max(0, p.dashCD - dt);
  if (p.onGround) { p.jumps = airJumps(); if (p.dashT <= 0) refillAbility(p); }

  // Способность (рывок, удар-молот, бластер, телепорт; планер — пока зажата)
  if (Input.pressed('dash')) useAbility(p, dir);

  if (p.dashT > 0) {
    p.dashT -= dt;
    p.vx = p.dashDir * DASH_V;
    p.vy = 0;
    if (p.dashT <= 0) p.vx = p.dashDir * RUN;
  } else if (p.pound) {
    // удар-молот: короткая пауза в воздухе и стремительное падение
    p.vx = 0;
    if (p.poundHang > 0) { p.poundHang -= dt; p.vy = 0; }
    else { p.vy = 1150; if (Math.random() < 0.6) emit(p.x + p.w / 2, p.y, 1, { color: '#ffffffaa', speed: 30, grav: -100, life: 0.3, size: 4 }); }
  } else {
    if (p.wallLock <= 0) {
      let acc = p.onGround ? (dir ? ACC_GROUND : DEC_GROUND) : ACC_AIR;
      if (L.ice && p.onGround && !p.standOn) acc = dir ? 650 : 280;   // лёд скользкий (платформы — нет)
      p.vx = approach(p.vx, dir * runSpeed() * (p.star > 0 ? 1.3 : 1), acc * dt);
      if (dir) p.face = dir;
    }
    // Гравитация: короткое нажатие — низкий прыжок
    let g = L.lowGrav ? GRAVITY * 0.55 : GRAVITY;
    if (p.vy < 0 && !Input.is('jump') && !p.bounced) g *= 2;
    if (p.vy > 0) p.bounced = false;
    p.vy += g * dt;
    // планер: пока кнопка зажата, падаем медленно
    p.gliding = equipped() === 'glide' && Input.is('dash') && !p.onGround && p.vy > 0;
    if (p.gliding) {
      p.vy = Math.min(p.vy, 100 - 22 * (Math.max(1, abilLv('glide')) - 1));
      if (Math.random() < 0.15) emit(p.x + p.w / 2, p.y - 8, 1, { color: '#ffffff88', speed: 20, grav: 0, life: 0.4 });
    }

    // Стены
    p.wallDir = 0;
    if (!p.onGround) {
      if (touchingWall(p, -1)) p.wallDir = -1;
      else if (touchingWall(p, 1)) p.wallDir = 1;
    }
    p.sliding = p.wallDir !== 0 && dir === p.wallDir && p.vy > 0;
    p.vy = Math.min(p.vy, p.sliding ? WALL_SLIDE : L.lowGrav ? MAX_FALL * 0.6 : MAX_FALL);
    if (p.sliding && Math.random() < 0.25) {
      emit(p.x + (p.wallDir > 0 ? p.w : 0), p.y + p.h - 4, 1, { color: '#ffffffaa', speed: 40, grav: 100, life: 0.3 });
    }

    // Прыжки
    if (p.buffer > 0) {
      if (p.coyote > 0) {
        p.vy = -JUMP_V; p.coyote = 0; p.buffer = 0; p.onGround = false;
        if (p.standOn && p.standOn.axis === 'y' && p.standOn.dy < 0) p.vy += p.standOn.dy / dt * 0.5;
        p.sx = 0.75; p.sy = 1.3;
        emit(p.x + p.w / 2, p.y + p.h, 6, { color: '#ffffffaa', angle: -Math.PI / 2, spread: 1.4, speed: 100, grav: 200, life: 0.35 });
        Sound.play('jump');
      } else if (p.wallDir !== 0) {
        p.vy = -WALL_JUMP_VY; p.vx = -p.wallDir * WALL_JUMP_VX; p.face = -p.wallDir;
        p.wallLock = 0.16; p.buffer = 0; p.jumps = airJumps(); refillAbility(p);
        p.sx = 0.75; p.sy = 1.3;
        emit(p.x + (p.wallDir > 0 ? p.w : 0), p.y + p.h / 2, 8, { color: '#ffffffcc', angle: p.wallDir > 0 ? Math.PI : 0, spread: 0.8, speed: 150, grav: 200, life: 0.35 });
        Sound.play('walljump');
      } else if (p.jumps > 0) {
        p.jumps--; p.vy = -DJUMP_V; p.buffer = 0; p.bounced = false;
        p.sx = 0.8; p.sy = 1.25;
        emit(p.x + p.w / 2, p.y + p.h, 14, { color: ['#6fd3ff', '#ffffff'], angle: Math.PI / 2, spread: 1.2, speed: 160, grav: 0, life: 0.4 });
        Sound.play('djump');
      }
    }
  }

  p.wasGround = p.onGround;
  moveX(p, dt);
  moveY(p, dt, Input.is('down'));

  // След рывка
  if (p.dashT > 0) p.trail.push({ x: p.x, y: p.y, face: p.face, life: 0.25 });
  for (let i = p.trail.length - 1; i >= 0; i--) {
    p.trail[i].life -= dt;
    if (p.trail[i].life <= 0) p.trail.splice(i, 1);
  }

  // Анимация
  p.sx = lerp(p.sx, 1, Math.min(1, dt * 12));
  p.sy = lerp(p.sy, 1, Math.min(1, dt * 12));
  if (p.onGround && Math.abs(p.vx) > 20) {
    const before = Math.sin(p.runPhase);
    p.runPhase += dt * Math.abs(p.vx) / 16;
    if (before < 0 && Math.sin(p.runPhase) >= 0) {
      emit(p.x + p.w / 2, p.y + p.h, 2, { color: '#ffffff88', angle: -Math.PI / 2, spread: 1.2, speed: 50, grav: 100, life: 0.3, size: 3 });
      Sound.play('step');
    }
  }
  p.blinkT -= dt;
  if (p.blinkT < -0.12) p.blinkT = rand(1.5, 4);
  const idle = p.onGround && Math.abs(p.vx) < 5 && !dir && !Input.is('jump');
  p.idleT = idle ? (p.idleT || 0) + dt : 0;
  Game.coinT = Math.max(0, Game.coinT - dt);
  skinTrail(p, dt);

  // Шипы
  const hb = { x: p.x + 3, y: p.y + 3, w: p.w - 6, h: p.h - 3 };
  const l = Math.floor(hb.x / TILE), r = Math.floor((hb.x + hb.w) / TILE);
  const t = Math.floor(hb.y / TILE), b = Math.floor((hb.y + hb.h) / TILE);
  for (let ty = t; ty <= b; ty++) for (let tx = l; tx <= r; tx++) {
    if (L.tile(tx, ty) === '^' && overlap(hb, { x: tx * TILE + 5, y: ty * TILE + 14, w: 22, h: 18 }) && p.spawnT <= 0) { killPlayer(); if (p.dead) return; }
  }
  // Падение в пропасть
  if (p.y > L.h + 64) { killPlayer('fall'); return; }

  // Монеты
  for (const c of L.coins) {
    if (!c.taken && overlap(p, c)) {
      c.taken = true;
      emit(c.x + 8, c.y + 8, 12, { color: ['#ffd54a', '#fff6c2'], speed: 180, grav: 200, life: 0.5 });
      Game.coinCombo = Game.coinT > 0 ? Game.coinCombo + 1 : 1;
      Game.coinT = 0.6;
      Sound.play('coin', Game.coinCombo);
      ring(c.x + 8, c.y + 8, '#ffd54a', 18);
      UI.updateHud();
    }
  }
  // Чекпоинты
  for (const k of L.checkpoints) {
    if (!k.active && overlap(p, k)) {
      L.checkpoints.forEach(o => { o.active = false; });
      k.active = true;
      k.actT = L.time;
      ring(k.x + 8, k.y + 20, '#56e39f', 60);
      floatText(k.x + 8, k.y - 6, T('checkpoint'), '#56e39f');
      L.respawnPoint = { x: k.x - 8, y: k.y + 32 };
      emit(k.x + 8, k.y + 6, 20, { color: ['#56e39f', '#fff'], speed: 220, life: 0.7 });
      Sound.play('checkpoint');
    }
  }
  // Враги и босс
  if (enemyContact(L, p, dt)) return;
  if (L.boss && bossContact(L, L.boss, p, dt)) return;
  // Финиш
  if (L.goal && !L.goal.hidden && overlap(p, L.goal)) completeLevel();
}

// ---------- Мир ----------
function updateWorld(dt) {
  const L = Game.level;
  const p = Game.player;
  L.time += dt;

  // Платформы
  for (const pl of L.platforms) {
    const ox = pl.x, oy = pl.y;
    const s = Math.sin(L.time * pl.speed + pl.phase) * pl.range;
    if (pl.axis === 'x') pl.x = pl.x0 + s; else pl.y = pl.y0 + s;
    pl.dx = pl.x - ox; pl.dy = pl.y - oy;
    if (p.standOn === pl && !p.dead) {
      p.x += pl.dx;
      p.y = pl.y - p.h;
      // не даём платформе втолкнуть робота в стену
      const before = p.vx; p.vx = pl.dx / dt; moveX(p, 0); p.vx = before;
    }
  }

  // Ломкие блоки
  for (const [key, cr] of L.crumbles) {
    if (cr.t >= 0) {
      cr.t -= dt;
      if (cr.t < 0) {
        cr.broken = true; cr.respawn = CRUMBLE_RESPAWN;
        const tx = key % L.cols, ty = Math.floor(key / L.cols);
        emit(tx * TILE + 16, ty * TILE + 16, 10, { color: ['#a0713f', '#6b4a2b'], speed: 120, size: 6, life: 0.8 });
      }
    } else if (cr.broken) {
      cr.respawn -= dt;
      if (cr.respawn <= 0) {
        const tx = key % L.cols, ty = Math.floor(key / L.cols);
        const box = { x: tx * TILE, y: ty * TILE, w: TILE, h: TILE };
        if (!overlap(p, box)) cr.broken = false; // не возвращаем блок прямо в робота
      }
    }
  }
  if (L.bounceAnim) { L.bounceAnim.t -= dt; if (L.bounceAnim.t <= 0) L.bounceAnim = null; }

  // Враги, снаряды, босс
  updateEnemies(L, p, dt);
  updateBullets(L, p, dt);
  updatePowerups(L, p, dt);
  updatePBullets(L, dt);
  if (L.boss) updateBoss(L, L.boss, p, dt);

  updatePlayer(p, dt);
  if (Game.state !== 'playing') return;

  // Камера
  updateCamera(dt);
}

function cameraTarget() {
  const L = Game.level, p = Game.player;
  let tx = p.x + p.w / 2 - viewW / 2 + p.face * 48 + p.vx * 0.15;
  let ty = p.y + p.h / 2 - viewH * 0.55;
  tx = L.w <= viewW ? (L.w - viewW) / 2 : clamp(tx, 0, L.w - viewW);
  // на сенсорных экранах приподнимаем мир над кнопками
  const pad = touchVisible() ? 120 * dpr / scale : 0;
  ty = L.h <= viewH ? L.h - viewH + pad : clamp(ty, 0, L.h - viewH + pad);
  return { x: tx, y: ty };
}
function snapCamera() { const t = cameraTarget(); Game.cam.x = t.x; Game.cam.y = t.y; }
function updateCamera(dt) {
  const t = cameraTarget();
  Game.cam.x = lerp(Game.cam.x, t.x, Math.min(1, dt * 6));
  Game.cam.y = lerp(Game.cam.y, t.y, Math.min(1, dt * 5));
}

// ============================================================
//  Отрисовка
// ============================================================
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  scale = Math.min(canvas.height / VIEW_H, canvas.width / MIN_VIEW_W);
  viewW = canvas.width / scale;
  viewH = canvas.height / scale;
}

function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }

function drawBackground(L, cam, t) {
  const th = L.theme;
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  // Дальний слой
  if (th.far === 'stars') {
    for (let i = 0; i < 90; i++) {
      const x = ((hash(i) * 2000 - cam.x * 0.05) % 2000 + 2000) % 2000;
      if (x > viewW) continue;
      const y = hash(i + 50) * viewH * 0.7;
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.5 + hash(i + 9)) + i));
      ctx.fillStyle = '#fff';
      const s = hash(i + 3) < 0.15 ? 3 : 2;
      ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,230,0.9)';
    ctx.beginPath(); ctx.arc(viewW * 0.78, viewH * 0.18, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = th.sky[0];
    ctx.beginPath(); ctx.arc(viewW * 0.78 + 10, viewH * 0.18 - 6, 22, 0, Math.PI * 2); ctx.fill();
  } else if (th.far === 'clouds') {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(viewW * 0.82, viewH * 0.17, 34, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,250,220,0.85)'; if (!th.noSun) ctx.fill();
    ctx.fillStyle = th.noSun ? 'rgba(120,135,150,0.75)' : 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 9; i++) {
      const span = 2400;
      const x = ((hash(i) * span - cam.x * 0.12 - t * 8) % span + span) % span - 200;
      const y = 30 + hash(i + 20) * viewH * 0.35;
      const s = 0.6 + hash(i + 40) * 0.8;
      ctx.beginPath();
      ctx.ellipse(x, y, 60 * s, 18 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 30 * s, y + 4 * s, 34 * s, 14 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 26 * s, y - 8 * s, 34 * s, 20 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (th.far === 'embers') {
    for (let i = 0; i < 60; i++) {
      const x = ((hash(i) * 1600 - cam.x * 0.2 + Math.sin(t + i) * 20) % 1600 + 1600) % 1600;
      if (x > viewW) continue;
      const y = viewH - ((hash(i + 7) * viewH + t * (20 + hash(i) * 40)) % viewH);
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + i);
      ctx.fillStyle = i % 2 ? '#ffb347' : '#ff6a3d';
      ctx.fillRect(x, y, 3, 3);
    }
    ctx.globalAlpha = 1;
  }

  // Горы — два параллакс-слоя
  const layer = (par, base, amp, color, seed) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, viewH);
    const off = cam.x * par;
    for (let x = 0; x <= viewW + 20; x += 20) {
      const wx = (x + off) / 160;
      const y = base - (Math.sin(wx + seed) * 0.5 + Math.sin(wx * 2.3 + seed * 2) * 0.3 + Math.sin(wx * 0.37) * 0.6) * amp
        - cam.y * par * 0.3;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(viewW, viewH);
    ctx.closePath();
    ctx.fill();
  };
  layer(0.15, viewH * 0.62, 60, th.mount2, 1);
  layer(0.3, viewH * 0.75, 50, th.mount, 4);
}

function drawTiles(L, cam, t) {
  const th = L.theme;
  const x0 = Math.max(0, Math.floor(cam.x / TILE) - 1), x1 = Math.min(L.cols - 1, Math.ceil((cam.x + viewW) / TILE) + 1);
  const y0 = Math.max(0, Math.floor(cam.y / TILE) - 1), y1 = Math.min(L.rows - 1, Math.ceil((cam.y + viewH) / TILE) + 1);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const c = L.grid[ty][tx];
      if (c === ' ') continue;
      const x = tx * TILE, y = ty * TILE;
      if (c === '#') {
        ctx.fillStyle = th.ground;
        ctx.fillRect(x, y, TILE, TILE);
        drawBlockPattern(L, tx, ty, x, y);
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        if ((tx + ty) % 2 === 0) ctx.fillRect(x + 6, y + 14, 6, 6);
        else ctx.fillRect(x + 20, y + 22, 5, 5);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(x, y, TILE, 2);
        const up = L.tile(tx, ty - 1);
        if (up !== '#' && up !== 'X' && up !== 'B') {
          ctx.fillStyle = th.topDark; ctx.fillRect(x, y, TILE, 11);
          ctx.fillStyle = th.top; ctx.fillRect(x, y, TILE, 8);
          ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, TILE, 2);
          if (L.ice) { ctx.fillStyle = 'rgba(190,235,255,0.7)'; ctx.fillRect(x, y, TILE, 4); ctx.fillStyle = '#fff'; ctx.fillRect(x + (tx * 7) % 24, y + 1, 5, 2); }
          ctx.fillStyle = th.top;
          ctx.fillRect(x + 4 + (tx % 3) * 6, y + 8, 4, 5);
          ctx.fillRect(x + 20 - (tx % 2) * 6, y + 8, 4, 4);
          // травинки покачиваются на ветру
          const sw = Math.sin(t * 2.2 + tx * 0.7) * 2.5;
          ctx.beginPath();
          ctx.moveTo(x + 6, y); ctx.lineTo(x + 8 + sw, y - 6); ctx.lineTo(x + 10, y);
          ctx.moveTo(x + 22, y); ctx.lineTo(x + 23.5 + sw, y - 4 - (tx % 3)); ctx.lineTo(x + 25, y);
          ctx.fill();
        }
        if (L.tile(tx - 1, ty) !== '#') { ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x, y, 2, TILE); }
        if (L.tile(tx + 1, ty) !== '#') { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + TILE - 3, y, 3, TILE); }
      } else if (c === '=') {
        ctx.fillStyle = th.topDark; roundRect(ctx, x, y, TILE, 10, 3); ctx.fill();
        ctx.fillStyle = th.top; roundRect(ctx, x, y, TILE, 6, 3); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x + 6, y + 10, 3, 6); ctx.fillRect(x + 23, y + 10, 3, 6);
      } else if (c === '^') {
        ctx.fillStyle = '#cfd6e6';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(x + i * 11 + 1, y + TILE);
          ctx.lineTo(x + i * 11 + 5.5, y + 12);
          ctx.lineTo(x + i * 11 + 10, y + TILE);
          ctx.fill();
        }
        ctx.fillStyle = '#8891a8';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(x + i * 11 + 5.5, y + 12);
          ctx.lineTo(x + i * 11 + 10, y + TILE);
          ctx.lineTo(x + i * 11 + 6.5, y + TILE);
          ctx.fill();
        }
      } else if (c === 'B') {
        const ba = L.bounceAnim && L.bounceAnim.tx === tx && L.bounceAnim.ty === ty ? L.bounceAnim.t / 0.3 : 0;
        const lift = Math.sin(ba * Math.PI) * 10;
        ctx.fillStyle = '#555c70'; ctx.fillRect(x + 2, y + 24, TILE - 4, 8);
        ctx.strokeStyle = '#c0c6d6'; ctx.lineWidth = 3;
        ctx.beginPath();
        const top = y + 12 - lift;
        for (let i = 0; i <= 4; i++) ctx.lineTo(x + (i % 2 ? 10 : 22), lerp(y + 24, top + 4, i / 4));
        ctx.stroke();
        ctx.fillStyle = '#ffd54a'; roundRect(ctx, x + 1, top, TILE - 2, 7, 3); ctx.fill();
        ctx.fillStyle = '#ff9f1c'; ctx.fillRect(x + 1, top + 5, TILE - 2, 2);
      } else if (c === 'X') {
        const cr = L.crumbles.get(ty * L.cols + tx);
        if (cr.broken) {
          if (cr.respawn < 0.6) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#a0713f'; ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
            ctx.globalAlpha = 1;
          }
          continue;
        }
        const sh = cr.t >= 0 ? rand(-1.5, 1.5) : 0;
        ctx.fillStyle = '#a0713f'; ctx.fillRect(x + sh, y, TILE, TILE);
        ctx.fillStyle = '#c48d55'; ctx.fillRect(x + sh, y, TILE, 5);
        ctx.strokeStyle = '#5e3f20'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + sh + 6, y + 6); ctx.lineTo(x + sh + 14, y + 16); ctx.lineTo(x + sh + 10, y + 26);
        ctx.moveTo(x + sh + 14, y + 16); ctx.lineTo(x + sh + 26, y + 12);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.strokeRect(x + sh + 1, y + 1, TILE - 2, TILE - 2);
      }
    }
  }
}

// Узор блока по теме + затемнение в глубине
const BLOCK_PATTERN = { 2: 'brick', 10: 'brick', 3: 'candy', 7: 'ice', 11: 'tech', 9: 'stone', 5: 'stone', 4: 'stone', 12: 'gold', 13: 'circuit' };
function drawBlockPattern(L, tx, ty, x, y) {
  const pat = BLOCK_PATTERN[L.def.theme] || 'dirt';
  ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = 1;
  if (pat === 'brick') {
    ctx.beginPath();
    ctx.moveTo(x, y + 16.5); ctx.lineTo(x + TILE, y + 16.5);
    const o = ty % 2 ? 0 : 16;
    ctx.moveTo(x + o + 0.5, y); ctx.lineTo(x + o + 0.5, y + 16);
    ctx.moveTo(x + ((o + 16) % 32) + 0.5, y + 16); ctx.lineTo(x + ((o + 16) % 32) + 0.5, y + 32);
    ctx.stroke();
  } else if (pat === 'stone') {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    const h = hash(tx * 3.1 + ty * 7.7);
    ctx.beginPath(); ctx.ellipse(x + 8 + h * 14, y + 12 + h * 8, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(x + 22 - h * 10, y + 24, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  } else if (pat === 'candy') {
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x - 4, y + 36); ctx.lineTo(x + 36, y - 4); ctx.stroke();
  } else if (pat === 'ice') {
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.moveTo(x + 6, y + 30); ctx.lineTo(x + 14, y + 18); ctx.lineTo(x + 26, y + 22); ctx.stroke();
  } else if (pat === 'gold') {
    ctx.strokeStyle = 'rgba(120,80,20,0.25)';
    ctx.strokeRect(x + 2.5, y + 2.5, TILE - 5, TILE - 5);
    ctx.fillStyle = 'rgba(255,240,200,0.18)'; ctx.fillRect(x + 4, y + 4, 6, 2);
  } else if (pat === 'circuit') {
    ctx.strokeStyle = 'rgba(0,255,200,0.28)';
    const h = hash(tx * 2.3 + ty * 5.9);
    ctx.beginPath();
    ctx.moveTo(x, y + 10 + h * 12); ctx.lineTo(x + 12, y + 10 + h * 12); ctx.lineTo(x + 18, y + 4 + h * 20); ctx.lineTo(x + TILE, y + 4 + h * 20);
    ctx.stroke();
    ctx.fillStyle = `rgba(0,255,200,${0.3 + 0.3 * Math.sin(performance.now() / 300 + tx)})`;
    ctx.fillRect(x + 11, y + 8 + h * 12, 3, 3);
  } else if (pat === 'tech') {
    ctx.strokeRect(x + 3.5, y + 3.5, TILE - 7, TILE - 7);
    ctx.fillStyle = 'rgba(192,140,255,0.25)';
    ctx.fillRect(x + 5, y + 5, 2, 2); ctx.fillRect(x + 25, y + 25, 2, 2);
  } else if (hash(tx * 1.3 + ty * 9.1) < 0.07) {
    // корешки в земле
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x + 10, y + 12); ctx.quadraticCurveTo(x + 16, y + 20, x + 12, y + 28); ctx.stroke();
  }
  // чем глубже, тем темнее
  let depth = 0;
  while (depth < 4 && L.solid(tx, ty - depth - 1)) depth++;
  if (depth > 0) { ctx.fillStyle = `rgba(0,0,0,${depth * 0.055})`; ctx.fillRect(x, y, TILE, TILE); }
}

function drawPlatforms(L) {
  for (const pl of L.platforms) {
    ctx.fillStyle = '#39406a';
    roundRect(ctx, pl.x, pl.y, pl.w, pl.h, 5); ctx.fill();
    ctx.fillStyle = '#8f9ad8';
    roundRect(ctx, pl.x, pl.y, pl.w, 6, 3); ctx.fill();
    ctx.fillStyle = '#ffd54a';
    for (let i = 0; i < 3; i++) ctx.fillRect(pl.x + 12 + i * 32, pl.y + 8, 8, 3);
    // направляющие
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
    ctx.beginPath();
    if (pl.axis === 'x') { ctx.moveTo(pl.x0 - pl.range + pl.w / 2, pl.y0 + 7); ctx.lineTo(pl.x0 + pl.range + pl.w / 2, pl.y0 + 7); }
    else { ctx.moveTo(pl.x0 + pl.w / 2, pl.y0 - pl.range); ctx.lineTo(pl.x0 + pl.w / 2, pl.y0 + pl.range + 14); }
    ctx.stroke(); ctx.setLineDash([]);
  }
}

function drawCoins(L, t) {
  for (const c of L.coins) {
    if (c.taken) continue;
    const bob = Math.sin(t * 3 + c.phase) * 3;
    const w = Math.abs(Math.cos(t * 2.5 + c.phase)) * 7 + 1.5;
    const cx = c.x + 8, cy = c.y + 8 + bob;
    ctx.fillStyle = 'rgba(255,213,74,0.25)';
    ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e09b00';
    ctx.beginPath(); ctx.ellipse(cx, cy, w, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(0.5, w - 2), 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(cx - w * 0.4, cy - 4, Math.max(1, w * 0.3), 3);
  }
}

function drawCheckpoints(L, t) {
  for (const k of L.checkpoints) {
    const bx = k.x + 6, by = k.y + k.h;
    ctx.fillStyle = '#9aa3bd'; ctx.fillRect(bx, k.y + 4, 4, k.h - 4);
    ctx.fillStyle = '#5a6380'; ctx.fillRect(bx - 6, by - 6, 16, 6);
    const col = k.active ? '#56e39f' : '#ff5d73';
    // флаг поднимается при активации
    const lift = k.active ? clamp((Game.level.time - (k.actT || 0)) / 0.6, 0, 1) : 0;
    const fy = k.y + 30 * (1 - lift * (2 - lift));
    ctx.fillStyle = col;
    ctx.beginPath();
    const wave = Math.sin(t * 6) * (k.active ? 3 : 1.5);
    ctx.moveTo(bx + 4, fy + 6);
    ctx.quadraticCurveTo(bx + 14, fy + 6 + wave, bx + 24, fy + 12);
    ctx.quadraticCurveTo(bx + 14, fy + 18 + wave, bx + 4, fy + 20);
    ctx.fill();
    ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.arc(bx + 2, k.y + 4, 3, 0, Math.PI * 2); ctx.fill();
    if (k.active) {
      ctx.fillStyle = 'rgba(86,227,159,0.25)';
      ctx.beginPath(); ctx.arc(bx + 2, k.y + 6, 10 + Math.sin(t * 4) * 2, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawGoal(L, t) {
  const g = L.goal; if (!g || g.hidden) return;
  const cx = g.x + 16, cy = g.y + 30;
  // портал
  for (let i = 3; i >= 0; i--) {
    ctx.fillStyle = ['#ffd54a', '#ff7ac8', '#6fd3ff', '#ffffff'][i];
    ctx.globalAlpha = 0.25 + i * 0.15;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 10 + i * 4 + Math.sin(t * 4 + i) * 1.5, 24 + i * 5 + Math.sin(t * 3 + i) * 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 6; i++) {
    const a = t * 2 + i * Math.PI / 3;
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx + Math.cos(a) * 22 - 1.5, cy + Math.sin(a) * 36 - 1.5, 3, 3);
  }
  // табличка
  ctx.fillStyle = '#5a6380'; ctx.fillRect(cx - 2, g.y - 26, 4, 18);
  ctx.fillStyle = '#ffd54a'; roundRect(ctx, cx - 20, g.y - 34, 40, 14, 4); ctx.fill();
  ctx.fillStyle = '#5a3d00'; ctx.font = 'bold 10px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('ФИНИШ', cx, g.y - 23.5);
}

function drawTexts() {
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const f of Game.texts) {
    ctx.globalAlpha = Math.min(1, f.life * 2);
    const w = f.icon ? ctx.measureText(f.text).width / 2 + 7 : 0;
    ctx.fillStyle = '#1b1b2a'; ctx.fillText(f.text, f.x + 1 - (f.icon ? 7 : 0), f.y + 1);
    ctx.fillStyle = f.color; ctx.fillText(f.text, f.x - (f.icon ? 7 : 0), f.y);
    if (f.icon) drawIcon(ctx, f.icon, f.x + w, f.y - 5, 13);
  }
  ctx.globalAlpha = 1;
}
function drawParticles() {
  for (const p of Game.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    const s = p.size * (0.5 + 0.5 * p.life / p.max);
    ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
}

function render(t) {
  const L = Game.level;
  if (Game.state === 'menu' || !L) { MenuScene.draw(); return; }
  const cam = { x: Game.cam.x, y: Game.cam.y };
  if (Game.shake > 0.1 && Save.data.shake) { cam.x += rand(-Game.shake, Game.shake); cam.y += rand(-Game.shake, Game.shake); }

  drawBackground(L, cam, t);
  drawDecor(L, cam, t);
  ctx.setTransform(scale, 0, 0, scale, -Math.round(cam.x * scale), -Math.round(cam.y * scale));

  // земля продолжается вниз за край уровня
  ctx.fillStyle = L.theme.ground;
  for (let tx = Math.max(0, Math.floor(cam.x / TILE)); tx < Math.min(L.cols, Math.ceil((cam.x + viewW) / TILE) + 1); tx++) {
    if (L.grid[L.rows - 1][tx] === '#') ctx.fillRect(tx * TILE, L.h, TILE, 600);
  }
  drawPlatforms(L);
  drawTiles(L, cam, t);
  drawProps(L, cam, t);
  drawLiquid(L, cam, t);
  drawCheckpoints(L, t);
  drawPowerups(L, t);
  drawGoal(L, t);
  drawCoins(L, t);
  drawEnemies(L, t);
  if (L.boss) drawBoss(L, L.boss, t);
  drawBullets(L, t);
  drawPBullets(L, t);

  const p = Game.player;
  if (p && Game.state !== 'menu') {
    for (const tr of p.trail) drawRobot({ ...p, face: tr.face }, tr.x, tr.y, tr.life * 1.6, true);
    if (Game.state === 'complete' && !p.dead) {
      // победный танец
      p.celebY = p.celebY ?? p.y;
      p.y = p.celebY - Math.abs(Math.sin(t * 6)) * 18;
      p.onGround = false;
      p.face = Math.sin(t * 3) > 0 ? 1 : -1;
    }
    if (!p.dead && !(p.spawnT > 0 && Math.floor(p.spawnT * 20) % 2 === 0)) drawRobot(p, p.x, p.y);
    drawPlayerPowers(p, t);
    drawGlider(p, t);
    if (p.idleT > 4 && !p.dead) {
      // робот задремал
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px system-ui, sans-serif'; ctx.textAlign = 'center';
      for (let k = 0; k < 3; k++) {
        const ph = (t * 0.6 + k / 3) % 1;
        ctx.globalAlpha = 1 - ph;
        ctx.fillText('z', p.x + p.w + 4 + ph * 14 + Math.sin(ph * 6) * 3, p.y - 6 - ph * 26);
      }
      ctx.globalAlpha = 1;
    }
  }
  drawRings();
  drawParticles();
  drawTexts();

  Weather.draw(t);
  if (L.dark) drawDarkness(L, cam, t);
  if (Game.lightning > 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(235,240,255,${Math.min(0.7, Game.lightning * 1.4) * (Math.sin(t * 60) > -0.3 ? 1 : 0.4)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (Game.flash > 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(255,80,100,${Game.flash * 0.5})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  // круглая шторка при старте уровня
  if (Game.iris < 1 && p) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const px = (p.x + p.w / 2 - cam.x) * scale, py = (p.y + p.h / 2 - cam.y) * scale;
    const e = Game.iris * Game.iris;
    const r = e * Math.hypot(canvas.width, canvas.height);
    ctx.fillStyle = '#0b0f24';
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.arc(px, py, Math.max(1, r), 0, Math.PI * 2, true);
    ctx.fill('evenodd');
  }
}

// ============================================================
//  Интерфейс
// ============================================================
const $ = id => document.getElementById(id);
const STYLES = ['neon', 'retro', 'blocks', 'cartoon'];
const BESTIARY = { walker: 'E', jumper: 'J', spiker: 'S', charger: 'H', turret: 'T', flyer: 'F', swooper: 'W', ghost: 'Q', saw: 'O', dropper: 'D', snail: 'N', slime: 'Y', spider: 'U', bomber: 'A', launcher: 'R' };

// Рисует на другом холсте теми же функциями отрисовки
function renderTo(c, fn) {
  const old = ctx;
  ctx = c;
  try { fn(); } finally { ctx = old; }
}

const UI = {
  toastTimer: null,
  last: {},
  worldTab: 0,

  show(name) {
    for (const s of ['menu', 'levels', 'howto', 'pause', 'complete', 'shop', 'settings', 'stats', 'wheel', 'upgrades']) {
      $('screen-' + s).classList.toggle('hidden', s !== name);
    }
    this.shopOpen = name === 'shop';
    Wheel.open = name === 'wheel';
  },

  // ---------- Магазин скинов ----------
  shopOpen: false,
  shopT: 0,
  buildShop() {
    $('shop-wallet').textContent = Save.data.wallet;
    const grid = $('shop-grid');
    grid.innerHTML = '';
    for (const skin of SKINS) {
      const owned = Save.data.skins.includes(skin.id) || (skin.req === 'final' && Save.data.champion);
      const selected = Save.data.skin === skin.id;
      const card = document.createElement('div');
      card.className = 'skin-card' + (selected ? ' selected' : '') + (owned ? ' owned' : '');
      const cv = document.createElement('canvas');
      cv.width = 96; cv.height = 96;
      const c = cv.getContext('2d');
      c.scale(2, 2);
      drawRobot(previewPose(1, false), 13, 12, 1, false, c, skin);
      card.appendChild(cv);
      const name = document.createElement('div');
      name.className = 'skin-name';
      name.textContent = tr(skin, 'name');
      card.appendChild(name);
      const btn = document.createElement('button');
      btn.className = 'btn small';
      if (selected) { btn.innerHTML = ico('check') + T('selected'); btn.disabled = true; }
      else if (owned) { btn.textContent = T('choose'); btn.classList.add('primary'); }
      else if (skin.req === 'final') { btn.innerHTML = ico('lock') + T('beatGame'); btn.disabled = true; }
      else {
        btn.innerHTML = ico('coin') + skin.price;
        if (Save.data.wallet < skin.price) btn.classList.add('off');
      }
      btn.addEventListener('click', e => {
        e.stopPropagation();
        Sound.init();
        if (owned) {
          Save.data.skin = skin.id; Save.store(); Sound.play('click');
        } else if (Save.data.wallet >= skin.price) {
          Save.data.wallet -= skin.price;
          Save.data.skins.push(skin.id);
          Save.data.skin = skin.id;
          Save.store();
          Sound.play('buy');
          this.toast(`<span class="t-title">${T('newSkin')}</span>${tr(skin, 'name')} — ${T('isYours')}`, 2200);
        } else {
          Sound.play('error');
          this.toast(`${T('needMore')} ${ico('coin')}${skin.price - Save.data.wallet}`, 2000);
          return;
        }
        this.buildShop();
      });
      card.appendChild(btn);
      grid.appendChild(card);
    }
  },
  animateShop(dt) {
    if (!this.shopOpen) return;
    this.shopT += dt;
    const cv = $('shop-preview'), c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);
    c.fillStyle = 'rgba(111,211,255,0.12)';
    c.beginPath(); c.ellipse(cv.width / 2, cv.height - 18, 46, 8, 0, 0, Math.PI * 2); c.fill();
    c.scale(3, 3);
    const pose = previewPose(this.shopT, true);
    const hop = Math.abs(Math.sin(this.shopT * 2.5)) * 8;
    pose.onGround = hop < 1;
    drawRobot(pose, cv.width / 6 - 11, cv.height / 3 - 34 - hop, 1, false, c);
  },

  // ---------- Улучшения ----------
  buildUpgrades() {
    $('up-wallet').textContent = Save.data.wallet;
    const st = abilState();
    const pips = (lv, max) => `<span class="pips">${Array.from({ length: max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</span>`;
    const pay = (cost, after) => {
      if (Save.data.wallet < cost) {
        Sound.play('error');
        this.toast(`${T('needMore')} ${ico('coin')}${cost - Save.data.wallet}`, 2000);
        return;
      }
      Save.data.wallet -= cost; after(); Save.store(); Sound.play('buy'); this.buildUpgrades();
    };
    $('up-active').innerHTML = '';
    for (const a of ABILITIES) {
      const lv = abilLv(a.id), isEq = st.equipped === a.id;
      const card = document.createElement('div');
      card.className = 'up-card' + (isEq ? ' selected' : '') + (lv ? ' owned' : '');
      card.innerHTML = `<div class="up-icon">${ico(a.icon)}</div><div class="up-body"><b>${tr(a, 'name')}</b>
        ${lv ? pips(lv, 3) : ''}<p>${tr(a, 'desc')}</p></div><div class="up-actions"></div>`;
      const box = card.querySelector('.up-actions');
      const mk = (html, cls, fn, disabled) => {
        const b = document.createElement('button');
        b.className = 'btn small ' + cls; b.innerHTML = html; b.disabled = !!disabled;
        b.addEventListener('click', e => { e.stopPropagation(); Sound.init(); fn(); });
        box.appendChild(b);
      };
      if (!lv) {
        mk(`${T('buy')} ${ico('coin')}${a.price}`, Save.data.wallet >= a.price ? 'primary' : 'off', () => pay(a.price, () => { st.lv[a.id] = 1; st.equipped = a.id; }));
      } else {
        if (isEq) mk(ico('check') + T('equipped'), '', () => {}, true);
        else mk(T('equip'), 'primary', () => { st.equipped = a.id; Save.store(); Sound.play('click'); this.buildUpgrades(); });
        if (lv < 3) {
          const cost = a.up[lv - 1];
          mk(`${ico('upgrade')}${T('upgrade')} ${ico('coin')}${cost}`, Save.data.wallet >= cost ? '' : 'off', () => pay(cost, () => { st.lv[a.id] = lv + 1; }));
        } else mk(T('max'), '', () => {}, true);
      }
      $('up-active').appendChild(card);
    }
    $('up-passive').innerHTML = '';
    for (const ps of PASSIVES) {
      const lv = pasLv(ps.id), max = ps.cost.length;
      const card = document.createElement('div');
      card.className = 'up-card' + (lv ? ' owned' : '');
      card.innerHTML = `<div class="up-icon">${ico(ps.icon)}</div><div class="up-body"><b>${tr(ps, 'name')}</b>
        ${pips(lv, max)}<p>${tr(ps, 'desc')}</p></div><div class="up-actions"></div>`;
      const b = document.createElement('button');
      b.className = 'btn small';
      if (lv >= max) { b.textContent = T('max'); b.disabled = true; }
      else {
        const cost = ps.cost[lv];
        b.innerHTML = `${ico('upgrade')}${ico('coin')}${cost}`;
        if (Save.data.wallet < cost) b.classList.add('off');
        b.addEventListener('click', e => { e.stopPropagation(); Sound.init(); pay(cost, () => { st.pas[ps.id] = lv + 1; }); });
      }
      card.querySelector('.up-actions').appendChild(b);
      $('up-passive').appendChild(card);
    }
    this.refreshAbilityButton();
  },
  refreshAbilityButton() {
    const a = ABILITIES.find(x => x.id === equipped());
    $('touch-ability').innerHTML = ico(a ? a.icon : 'dash');
  },

  // ---------- Справочник врагов ----------
  buildBestiary() {
    const box = $('bestiary');
    box.innerHTML = '';
    const names = T('enemyNames');
    for (const type in BESTIARY) {
      const item = document.createElement('div');
      item.className = 'beast';
      const cv = document.createElement('canvas');
      cv.width = 112; cv.height = 96;
      const c = cv.getContext('2d');
      c.scale(2, 2);
      const e = makeEnemy(BESTIARY[type], 0, 0);
      e.t = 1.3; e.face = 1; e.grounded = true; e.timer = 1;
      if (e.type === 'saw') { e.cx = 28; e.cy = 24; e.x = 14; e.y = 10; }
      else if (e.type === 'spider') { e.x = 16; e.y = 16; e.anchor = 0; }
      else if (e.type === 'dropper') { e.x = 13; e.x0 = 13; e.y = 4; e.y0 = 200; }
      else { e.x = 28 - e.w / 2; e.y = 40 - e.h; }
      renderTo(c, () => drawEnemy(e, 1.3));
      item.appendChild(cv);
      const [n, d] = names[type];
      item.insertAdjacentHTML('beforeend', `<div><b>${n}</b><p>${d}</p></div>`);
      box.appendChild(item);
    }
  },

  // ---------- Статистика ----------
  buildStats() {
    const st = Save.data.stats;
    let stars = 0, done = 0;
    for (let i = 0; i < LEVELS.length; i++) if (Save.data.best[i]) { stars += Save.data.best[i].stars; done++; }
    const h = Math.floor(st.time / 3600), m = Math.floor(st.time / 60) % 60;
    const rows = [
      ['coin', 'stBank', Save.data.wallet],
      ['trophy', 'stEarned', st.coins],
      ['star', 'stStars', `${stars} / ${LEVELS.length * 3}`],
      ['map', 'stLevels', `${done} / ${LEVELS.length}`],
      ['refresh', 'stRuns', st.completed],
      ['bolt', 'stKills', st.kills],
      ['crown', 'stBosses', st.bosses],
      ['deaths', 'stDeaths', st.deaths],
      ['clock', 'stTime', h ? `${h} ${T('hours')} ${m} ${T('mins')}` : `${m} ${T('mins')}`],
      ['palette', 'stSkins', `${Save.data.skins.length + (Save.data.champion && !Save.data.skins.includes('champion') ? 1 : 0)} / ${SKINS.length}`],
    ];
    $('stats-list').innerHTML = rows.map(([icon, k, v]) => `<span>${ico(icon)}${T(k)}</span><b>${v}</b>`).join('');
  },

  // ---------- Настройки ----------
  buildSettings() {
    $('set-sfx').value = Math.round(Save.data.sfxVol * 100);
    $('set-music').value = Math.round(Save.data.musicVol * 100);
    $('set-shake').checked = !!Save.data.shake;
    const seg = (id, items, cur, fn) => {
      const box = $(id);
      box.innerHTML = '';
      for (const [key, label] of items) {
        const b = document.createElement('button');
        b.className = 'seg-btn' + (key === cur ? ' on' : '');
        b.textContent = label;
        b.addEventListener('click', e => { e.preventDefault(); Sound.play('click'); fn(key); this.buildSettings(); });
        box.appendChild(b);
      }
    };
    seg('set-lang', Object.entries(LANGS), lang(), k => { Save.data.lang = k; Save.store(); this.applyLang(); });
    seg('set-style', STYLES.map(s => [s, T('styles')[s]]), Save.data.menuStyle, k => { Save.data.menuStyle = k; Save.store(); applyStyle(); });
  },

  applyLang() {
    applyLang();
    this.refreshToggles();
    this.refreshMenu();
  },

  toast(html, ms) {
    const el = $('toast');
    el.innerHTML = html;
    el.classList.remove('hidden');
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.add('hidden'), ms);
  },
  hideToast() { clearTimeout(this.toastTimer); $('toast').classList.add('hidden'); },

  updateHud(force) {
    const L = Game.level; if (!L) return;
    const p = Game.player;
    const vals = {
      level: `${L.index + 1}. ${levelName(L.index)}`,
      coins: `${L.coinsTaken}/${L.coinsTotal}`,
      time: fmtTime(L.time),
      deaths: String(L.deaths),
    };
    for (const k in vals) {
      if (force || this.last[k] !== vals[k]) { $('hud-' + k).textContent = vals[k]; this.last[k] = vals[k]; }
    }
    const pw = powerHud(p);
    if (force || this.last.powers !== pw) { $('hud-powers').innerHTML = pw; $('hud-powers-pill').classList.toggle('hidden', !pw); this.last.powers = pw; }
    const hearts = p && !p.dead ? `${p.hp}/${p.maxHp}` : this.last.hearts;
    if (p && (force || this.last.hearts !== hearts)) {
      $('hud-hearts').innerHTML = p.maxHp > 1 ? Array.from({ length: p.maxHp }, (_, i) => ico(i < p.hp ? 'heart' : 'heartOff')).join('') : '';
      this.last.hearts = hearts;
    }
  },

  updateBoss(b) {
    const bar = $('bossbar');
    if (!b || b.dead) { bar.classList.add('hidden'); return; }
    bar.classList.remove('hidden');
    $('boss-name').textContent = tr(b, 'name');
    $('boss-fill').style.width = (b.hp / b.maxHp * 100) + '%';
  },

  refreshToggles() {
    document.querySelectorAll('[data-action="toggle-sound"]').forEach(b => b.classList.toggle('off', Save.data.muted));
    document.querySelectorAll('[data-action="toggle-music"]').forEach(b => b.classList.toggle('off', !Save.data.music));
  },

  refreshMenu() {
    let stars = 0;
    for (let i = 0; i < LEVELS.length; i++) stars += Save.data.best[i] ? Save.data.best[i].stars : 0;
    $('menu-total').textContent = `${stars} / ${LEVELS.length * 3}`;
    $('menu-wallet').textContent = Save.data.wallet;
  },

  buildLevels() {
    const worlds = Math.ceil(LEVELS.length / 10);
    const tabs = $('world-tabs');
    tabs.innerHTML = '';
    for (let w = 0; w < worlds; w++) {
      const b = document.createElement('button');
      const locked = w * 10 + 1 > Save.data.unlocked;
      b.className = 'tab' + (w === this.worldTab ? ' on' : '') + (locked ? ' locked' : '');
      b.innerHTML = `${locked ? ico('lock') : ''}<span>${T('world')} ${w + 1}</span><small>${T('worlds')[w] || ''}</small>`;
      b.addEventListener('click', () => { Sound.play('click'); this.worldTab = w; this.buildLevels(); });
      tabs.appendChild(b);
    }
    const grid = $('level-grid');
    grid.innerHTML = '';
    for (let i = this.worldTab * 10; i < Math.min(LEVELS.length, this.worldTab * 10 + 10); i++) {
      const lv = LEVELS[i];
      const b = document.createElement('button');
      b.className = 'level-card' + (lv.boss ? ' boss' : '');
      const best = Save.data.best[i];
      const locked = i + 1 > Save.data.unlocked;
      b.disabled = locked;
      const st = best ? best.stars : 0;
      b.innerHTML = `<span class="num">${T('level')} ${i + 1}</span>
        <span class="name">${locked ? ico('lock') : lv.boss ? ico('crown') : ''}${levelName(i)}</span>
        <span class="lstars">${[0, 1, 2].map(k => ico(k < st ? 'star' : 'starOff')).join('')}</span>
        <span class="best">${best ? T('best') + ': ' + fmtTime(best.time) + ' ' + T('sec') : T('target') + ': ' + lv.par + ' ' + T('sec')}</span>`;
      b.addEventListener('click', () => { Sound.init(); Sound.play('click'); startLevel(i); });
      grid.appendChild(b);
    }
  },

  showComplete(r) {
    const L = Game.level;
    const last = L.index === LEVELS.length - 1;
    $('complete-title').innerHTML = (last ? ico('trophy') : '') + T(last ? 'gameDone' : 'levelDone');
    $('complete-stars').innerHTML = [0, 1, 2].map(i =>
      `<span class="${i < r.stars ? 'on' : 'off'}" style="animation-delay:${0.15 + i * 0.2}s">${ico(i < r.stars ? 'star' : 'starOff')}</span>`).join('');
    const best = Save.data.best[L.index];
    const ok = v => v ? ico('check', 'ok') : '';
    $('complete-stats').innerHTML = `
      <span>${T('time')}</span><b>${fmtTime(L.time)} ${T('sec')} ${r.newTime ? `<span class="new">${T('newRecord')}</span>` : ''}</b>
      <span>${T('best')}</span><b>${fmtTime(best.time)} ${T('sec')}</b>
      <span>${T('coins')}</span><b>${L.coinsTaken}/${L.coinsTotal} ${ok(r.allCoins)}</b>
      <span>${T('goalTime')}</span><b>${L.def.par} ${T('sec')} ${ok(r.fast)}</b>
      <span>${T('falls')}</span><b>${L.deaths}</b>
      <span>${T('reward')}</span><b class="new">+${r.reward} ${ico('coin')}</b>`;
    $('btn-next').classList.toggle('hidden', last);
    setTimeout(() => this.show('complete'), 700);
  },
};

function applyStyle() {
  const s = STYLES.includes(Save.data.menuStyle) ? Save.data.menuStyle : 'neon';
  document.body.className = 'style-' + s;
  MenuScene.reset();
}

function setState(s) {
  Game.state = s;
  $('hud').classList.toggle('hidden', s !== 'playing' && s !== 'paused');
  $('btn-pause').classList.toggle('hidden', s !== 'playing');
  if (s !== 'playing' && s !== 'paused') $('bossbar').classList.add('hidden');
  $('touch').classList.toggle('hidden', !(s === 'playing' && isTouch()));
  if (s === 'playing') UI.show(null);
  if (s !== 'playing') Input.touch = {};
}

function touchVisible() { return !$('touch').classList.contains('hidden'); }
function isTouch() { return ('ontouchstart' in window) || navigator.maxTouchPoints > 0; }

function pause() { if (Game.state === 'playing') { setState('paused'); UI.show('pause'); UI.hideToast(); } }
function resume() { if (Game.state === 'paused') setState('playing'); }

function goMenu() {
  Game.level = null;
  Game.particles = [];
  MenuScene.reset();
  Sound.setTrack('menu');
  Sound.setAmbient(null);
  Wheel.open = false;
  UI.updateBoss(null);
  Game.player = null;
  setState('menu');
  UI.hideToast();
  UI.refreshMenu();
  UI.show('menu');
}

function handleAction(a) {
  Sound.init();
  Sound.play('click');
  switch (a) {
    case 'continue': {
      // первый непройденный открытый уровень
      let i = 0;
      while (i < LEVELS.length - 1 && Save.data.best[i] && i + 1 < Save.data.unlocked) i++;
      startLevel(i);
      break;
    }
    case 'wheel': Wheel.show(); UI.show('wheel'); break;
    case 'levels':
      if (Game.state === 'paused' || Game.state === 'complete') goMenu();
      UI.worldTab = Math.min(Math.floor((Math.min(Save.data.unlocked, LEVELS.length) - 1) / 10), Math.ceil(LEVELS.length / 10) - 1);
      UI.buildLevels(); UI.show('levels');
      break;
    case 'howto': UI.buildBestiary(); UI.show('howto'); break;
    case 'upgrades': UI.buildUpgrades(); UI.show('upgrades'); break;
    case 'shop': UI.buildShop(); UI.show('shop'); break;
    case 'stats': UI.buildStats(); UI.show('stats'); break;
    case 'settings': UI.buildSettings(); UI.show('settings'); break;
    case 'reset':
      if (confirm(T('resetConfirm'))) {
        try { localStorage.removeItem('robplay-save'); } catch (e) { /* ignore */ }
        location.reload();
      }
      break;
    case 'menu': goMenu(); break;
    case 'resume': resume(); break;
    case 'restart': startLevel(Game.level.index); break;
    case 'next':
      if (Game.level.index === LEVELS.length - 1) goMenu();
      else startLevel(Game.level.index + 1);
      break;
    case 'toggle-sound': Save.data.muted = !Save.data.muted; Save.store(); Sound.apply(); UI.refreshToggles(); break;
    case 'toggle-music': Save.data.music = !Save.data.music; Save.store(); Sound.apply(); UI.refreshToggles(); break;
  }
}

// ---------- События ----------
document.addEventListener('click', e => {
  const b = e.target.closest('[data-action]');
  if (b) handleAction(b.dataset.action);
});
$('btn-pause').addEventListener('click', () => { Sound.init(); pause(); });
$('btn-spin').addEventListener('click', () => Wheel.spin());
let hoverT = 0;
document.addEventListener('pointerover', e => {
  if (e.target.closest && e.target.closest('.btn, .level-card, .skin-card') && performance.now() - hoverT > 60) {
    hoverT = performance.now(); Sound.play('hover');
  }
});
$('set-sfx').addEventListener('input', e => { Save.data.sfxVol = e.target.value / 100; Save.store(); Sound.init(); Sound.apply(); });
$('set-sfx').addEventListener('change', () => Sound.play('coin'));
$('set-music').addEventListener('input', e => { Save.data.musicVol = e.target.value / 100; Save.store(); Sound.init(); Sound.apply(); });
$('set-shake').addEventListener('change', e => { Save.data.shake = e.target.checked; Save.store(); });

window.addEventListener('keydown', e => {
  const a = KEYMAP[e.code];
  if (a) {
    if (!Input.keys[a]) Input.latch[a] = true;
    Input.keys[a] = true;
    e.preventDefault();
  }
  Sound.init();
  if (e.repeat) return;
  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (Game.state === 'playing') pause(); else if (Game.state === 'paused') resume();
  } else if (e.code === 'KeyR' && (Game.state === 'playing' || Game.state === 'paused')) {
    startLevel(Game.level.index);
  } else if (e.code === 'KeyM') {
    handleAction('toggle-music');
  } else if (e.code === 'Enter') {
    if (Game.state === 'menu' && !$('screen-menu').classList.contains('hidden')) handleAction('continue');
    else if (Game.state === 'complete') handleAction(Game.level.index < LEVELS.length - 1 ? 'next' : 'menu');
  }
});
window.addEventListener('keyup', e => {
  const a = KEYMAP[e.code];
  if (a) { Input.keys[a] = false; e.preventDefault(); }
});
window.addEventListener('blur', () => { Input.keys = {}; Input.touch = {}; pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

document.querySelectorAll('.tbtn').forEach(btn => {
  const k = btn.dataset.key;
  const on = e => { e.preventDefault(); Sound.init(); if (!Input.touch[k]) Input.latch[k] = true; Input.touch[k] = true; btn.classList.add('active'); };
  const off = e => { e.preventDefault(); Input.touch[k] = false; btn.classList.remove('active'); };
  btn.addEventListener('pointerdown', on);
  btn.addEventListener('pointerup', off);
  btn.addEventListener('pointercancel', off);
  btn.addEventListener('pointerleave', off);
  btn.addEventListener('contextmenu', e => e.preventDefault());
});

window.addEventListener('resize', resize);

// ---------- Главный цикл ----------
let lastT = performance.now(), acc = 0, padPauseHeld = false;
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  const t = now / 1000;

  // Пауза с геймпада
  Input.poll();
  if (Input.pad.pause && !padPauseHeld) { if (Game.state === 'playing') pause(); else if (Game.state === 'paused') resume(); }
  padPauseHeld = !!Input.pad.pause;

  if (Game.state === 'playing') {
    acc += dt;
    while (acc >= STEP) {
      Input.update();
      updateWorld(STEP);
      updateParticles(STEP);
      if (Game.state !== 'playing') { acc = 0; break; }
      acc -= STEP;
    }
    UI.updateHud();
  } else {
    acc = 0;
    updateParticles(dt);
    if (Game.state === 'menu') {
      MenuScene.update(dt);
      UI.animateShop(dt);
      Wheel.update(dt);
    }
  }
  if (Game.level && Game.state !== 'paused') Weather.update(dt, Game.cam);
  Game.lightning = Math.max(0, Game.lightning - dt);
  Game.shake = Math.max(0, Game.shake - dt * 40);
  Game.flash = Math.max(0, Game.flash - dt);

  render(t);
  requestAnimationFrame(frame);
}

// ---------- Запуск ----------
Save.load();
if (!Save.data.lang) Save.data.lang = (navigator.language || 'ru').startsWith('ru') ? 'ru' : 'en';
renderIcons();
applyLang();
applyStyle();
resize();
UI.refreshToggles();
UI.refreshAbilityButton();
goMenu();
requestAnimationFrame(frame);

// Для отладки и автотестов
window.RobPlay = { Game, startLevel, LEVELS, Save, Input, updateWorld, STEP, TILE, makeEnemy, UI };
