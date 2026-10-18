'use strict';

// ============================================================
//  Кат-сцены: сюжет, появление боссов, финал
// ============================================================

function drawCrystal(x, y, s, t, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y + Math.sin(t * 2) * 4);
  const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 70 * s);
  g.addColorStop(0, 'rgba(143,233,255,0.8)'); g.addColorStop(1, 'rgba(143,233,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 70 * s, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.rotate(t * 0.5);
  ctx.strokeStyle = 'rgba(200,250,255,0.35)'; ctx.lineWidth = 2;
  for (let k = 0; k < 8; k++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(26 * s, 0); ctx.lineTo(50 * s, 0); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = '#8fe9ff';
  ctx.beginPath(); ctx.moveTo(0, -26 * s); ctx.lineTo(14 * s, 0); ctx.lineTo(0, 26 * s); ctx.lineTo(-14 * s, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d8fbff';
  ctx.beginPath(); ctx.moveTo(0, -26 * s); ctx.lineTo(5 * s, 0); ctx.lineTo(0, 26 * s); ctx.lineTo(-14 * s, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function fakeBoss(kind, x, y, t, state) {
  const info = BOSS_INFO[kind];
  return { kind, w: info.w, h: info.h, x: x - info.w / 2, y: y - info.h, face: -1, state: state || 'walk', t, hp: info.hp, maxHp: info.hp, inv: 0, grounded: true, vx: kind === 1 ? 1 : 0, dead: false };
}

function bigRobot(x, y, s, t, opts = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const pose = previewPose(t, !!opts.run);
  pose.face = opts.face || 1;
  if (opts.hop) { pose.onGround = false; }
  drawRobot(pose, -11, -28 - (opts.hop ? Math.abs(Math.sin(t * 5)) * 8 : 0), 1, false, ctx);
  ctx.restore();
}

function firework(t, seed) {
  if (Math.random() < 0.04) {
    const x = rand(viewW * 0.15, viewW * 0.85), y = rand(viewH * 0.1, viewH * 0.4);
    const col = ['#ffd54a', '#ff7ac8', '#6fd3ff', '#56e39f', '#ff8a3d'][Math.floor(rand(0, 5))];
    emit(x, y, 40, { color: [col, '#ffffff'], speed: 260, grav: 120, life: 1.4, size: 4 });
    Sound.play('firework');
  }
}

const CUTSCENES = {
  intro: [
    {
      draw(t) { MenuScene.draw({ robot: false, items: false }); drawCrystal(viewW * 0.5, viewH * 0.3, 1, t); },
      lines: [
        ['', 'Далеко-далеко стоит Город Роботов.'],
        ['', 'Днём и ночью его освещает волшебный Энергокристалл.'],
      ],
    },
    {
      draw(t) {
        MenuScene.draw({ robot: false, items: false, sky: 'red', dark: true });
        const k = Math.min(1, t / 3);
        const b = fakeBoss(3, viewW * 0.5, viewH * (0.05 + 0.3 * Math.min(1, t / 1.5)) + 32, t, 'float');
        drawCrystal(viewW * 0.5, viewH * 0.3 - k * viewH * 0.12, 0.8, t, 1);
        ctx.save(); ctx.translate(0, -k * viewH * 0.12); drawBoss(null, b, t); ctx.restore();
        if (Math.random() < 0.02) { Game.lightning = 0.3; Sound.play('thunder'); }
      },
      lines: [
        ['Ядро Хаоса', 'Ха-ха-ха! Теперь энергия кристалла — моя!'],
        ['', 'Огни города погасли один за другим...'],
      ],
    },
    {
      draw(t) {
        MenuScene.draw({ robot: false, items: false, sky: 'night', dark: true });
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, viewW, viewH);
        const glow = ctx.createRadialGradient(viewW / 2, viewH * 0.55, 10, viewW / 2, viewH * 0.55, 200);
        glow.addColorStop(0, 'rgba(111,211,255,0.35)'); glow.addColorStop(1, 'rgba(111,211,255,0)');
        ctx.fillStyle = glow; ctx.fillRect(0, 0, viewW, viewH);
        bigRobot(viewW / 2, viewH * 0.72, 4, t);
      },
      lines: [
        ['Роб', 'Кто-то же должен это исправить...'],
        ['Роб', 'Я верну кристалл! Ждите меня!'],
        ['', 'Так начинается большое путешествие маленького робота.'],
      ],
    },
  ],
  boss1: [{
    draw(t) {
      const L = { def: { theme: 10 }, theme: THEMES[10] };
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#15161c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      drawDecor({ def: L.def, theme: L.theme }, { x: t * 20, y: 0 }, t);
      ctx.fillStyle = '#3a3d4a'; ctx.fillRect(0, viewH * 0.78, viewW, viewH);
      ctx.fillStyle = '#ffb347'; ctx.fillRect(0, viewH * 0.78, viewW, 6);
      const stomp = Math.abs(Math.sin(t * 3));
      ctx.save(); ctx.translate(viewW * 0.65, viewH * 0.78); ctx.scale(2.4, 2.4);
      drawBoss(null, fakeBoss(1, 0, -stomp * 6, t, 'walk'), t); ctx.restore();
      if (stomp < 0.05 && Math.random() < 0.5) { Game.shake = 6; }
      bigRobot(viewW * 0.25, viewH * 0.78, 2.2, t);
    },
    lines: [['Громобот', 'СТОЯТЬ, ЖЕСТЯНКА! Дальше прохода нет!'], ['Роб', 'Посмотрим, кто кого!']],
  }],
  world2: [{
    draw(t) {
      const L = { def: { theme: 7 }, theme: THEMES[7] };
      drawBackground(L, { x: t * 30, y: 0 }, t);
      drawDecor(L, { x: t * 30, y: 0 }, t);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, viewH * 0.82, viewW, viewH);
      bigRobot(viewW * 0.3, viewH * 0.82, 2.5, t, { run: true });
      if (Math.random() < 0.3) emit(rand(0, viewW), -5, 1, { color: '#fff', speed: 30, grav: 40, life: 4, size: 4 });
    },
    title: 'Мир 2 · Стихии',
    lines: [['', 'Громобот повержен! Но след Ядра Хаоса уводит через льды, пустыни и бури...']],
  }],
  boss2: [{
    draw(t) {
      const L = { def: { theme: 6 }, theme: THEMES[6] };
      drawBackground(L, { x: t * 10, y: 0 }, t);
      ctx.fillStyle = '#3d3a2e'; ctx.fillRect(0, viewH * 0.8, viewW, viewH);
      ctx.save(); ctx.translate(viewW * 0.62, viewH * 0.32 + Math.sin(t * 2) * 8); ctx.scale(2.6, 2.6);
      drawBoss(null, fakeBoss(2, 0, 26, t, 'hover'), t); ctx.restore();
      bigRobot(viewW * 0.25, viewH * 0.8, 2.2, t);
      if (Math.random() < 0.015) { Game.lightning = 0.5; Sound.play('thunder'); }
      for (let i = 0; i < 6; i++) emit(rand(0, viewW), -5, 1, { color: 'rgba(190,215,255,0.6)', angle: Math.PI / 2, spread: 0.05, speed: 700, grav: 0, life: 1.2, size: 2 });
    },
    lines: [['Буревестник', 'Я — повелитель бурь! Тебе не пролететь сквозь мой шторм!'], ['Роб', 'Ну держись, тучка!']],
  }],
  world3: [{
    draw(t) {
      const L = { def: { theme: 5 }, theme: THEMES[5] };
      drawBackground(L, { x: t * 20, y: 0 }, t);
      drawDecor(L, { x: t * 20, y: 0 }, t);
      ctx.fillStyle = '#3a2a33'; ctx.fillRect(0, viewH * 0.82, viewW, viewH);
      ctx.fillStyle = '#ff8a3d'; ctx.fillRect(0, viewH * 0.82, viewW, 6);
      bigRobot(viewW * 0.3, viewH * 0.82, 2.5, t, { run: true });
    },
    title: 'Мир 3 · Хаос',
    lines: [['', 'Буря утихла. Остался последний путь: заброшенный завод, открытый космос и сердце вулкана.']],
  }],
  boss3: [{
    draw(t) {
      const L = { def: { theme: 11 }, theme: THEMES[11] };
      drawBackground(L, { x: 0, y: 0 }, t);
      drawDecor(L, { x: t * 5, y: 0 }, t);
      ctx.fillStyle = '#3a3550'; ctx.fillRect(0, viewH * 0.8, viewW, viewH);
      drawCrystal(viewW * 0.68, viewH * 0.18, 0.7, t);
      ctx.save(); ctx.translate(viewW * 0.68, viewH * 0.45); ctx.scale(2.4, 2.4);
      drawBoss(null, fakeBoss(3, 0, 32, t, 'float'), t); ctx.restore();
      bigRobot(viewW * 0.25, viewH * 0.8, 2.2, t);
    },
    lines: [['Ядро Хаоса', 'Ты зашёл слишком далеко, маленькая жестянка.'], ['Роб', 'Верни кристалл городу. Сейчас же!'], ['Ядро Хаоса', 'Попробуй отнять!']],
  }],
  ending: [
    {
      draw(t) {
        MenuScene.draw({ robot: false, items: false });
        drawCrystal(viewW * 0.5, viewH * 0.28, 1.2, t);
        bigRobot(viewW * 0.5, viewH - 70, 2.5, t, { hop: true });
        firework(t);
        drawParticles();
      },
      lines: [
        ['', 'Ядро Хаоса рассыпалось на искры, и Энергокристалл вернулся домой!'],
        ['Жители', 'Ура-а-а! Роб — наш герой!'],
        ['Роб', 'Это было весело. Но я бы не отказался от отпуска...'],
      ],
    },
    {
      draw(t) {
        MenuScene.draw({ robot: false, items: false, sky: 'night' });
        firework(t);
        drawParticles();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd54a'; ctx.font = 'bold 42px system-ui, sans-serif';
        ctx.fillText('RobPlay', viewW / 2, viewH * 0.35);
        ctx.fillStyle = '#fff'; ctx.font = '20px system-ui, sans-serif';
        ctx.fillText('Спасибо за игру! ♥', viewW / 2, viewH * 0.35 + 40);
      },
      lines: [['', 'Новый скин «Чемпион» ждёт тебя в магазине. Попробуй собрать все 90 звёзд!']],
    },
  ],
};

const Cutscene = {
  scenes: null, scene: 0, line: 0, chars: 0, t: 0, onDone: null, lastBlip: 0,

  play(id, onDone) {
    this.scenes = CUTSCENES[id];
    this.scene = 0; this.line = 0; this.chars = 0; this.t = 0;
    this.onDone = onDone;
    Save.data.seen[id] = true;
    Save.store();
    Game.particles = [];
    setState('cutscene');
    UI.show(null);
    UI.hideToast();
    $('cutscene').classList.remove('hidden');
    Sound.setTrack('story');
    this.refresh();
  },

  current() { return this.scenes[this.scene]; },
  text() { const l = this.current().lines[this.line]; return l ? l[1] : ''; },

  refresh() {
    const sc = this.current(), l = sc.lines[this.line];
    $('cs-who').textContent = l[0];
    $('cs-who').classList.toggle('hidden', !l[0]);
    $('cs-title').textContent = sc.title || '';
    $('cs-title').classList.toggle('hidden', !sc.title);
    $('cs-text').textContent = '';
  },

  update(dt) {
    this.t += dt;
    const full = this.text();
    if (this.chars < full.length) {
      const before = Math.floor(this.chars);
      this.chars = Math.min(full.length, this.chars + dt * 38);
      const now = Math.floor(this.chars);
      if (now !== before) {
        $('cs-text').textContent = full.slice(0, now);
        if (now - this.lastBlip >= 2 && full[now - 1] !== ' ') { this.lastBlip = now; Sound.play('blip'); }
      }
    }
  },

  next() {
    const full = this.text();
    if (this.chars < full.length) { this.chars = full.length; $('cs-text').textContent = full; return; }
    Sound.play('click');
    this.line++;
    this.chars = 0; this.lastBlip = 0;
    if (this.line >= this.current().lines.length) {
      this.scene++; this.line = 0; this.t = 0;
      Game.particles = [];
      if (this.scene >= this.scenes.length) { this.finish(); return; }
    }
    this.refresh();
  },

  finish() {
    $('cutscene').classList.add('hidden');
    const cb = this.onDone;
    this.scenes = null;
    if (cb) cb();
  },

  draw() {
    if (!this.scenes) return;
    const t = this.t;
    ctx.save();
    if (Game.shake > 0.1 && Save.data.shake) ctx.translate(rand(-Game.shake, Game.shake) * scale, rand(-Game.shake, Game.shake) * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    this.current().draw(t);
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // кинематографичные полосы
    const bar = canvas.height * 0.09;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, bar);
    ctx.fillRect(0, canvas.height - bar, canvas.width, bar);
    if (Game.lightning > 0) {
      ctx.fillStyle = `rgba(235,240,255,${Math.min(0.6, Game.lightning)})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // плавное появление сцены
    if (t < 0.6) {
      ctx.fillStyle = `rgba(0,0,0,${1 - t / 0.6})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  },
};

// Какая кат-сцена идёт перед уровнем
const LEVEL_CUTSCENES = { 0: 'intro', 9: 'boss1', 10: 'world2', 19: 'boss2', 20: 'world3', 29: 'boss3' };

function playLevel(i) {
  const id = LEVEL_CUTSCENES[i];
  if (id && !Save.data.seen[id]) Cutscene.play(id, () => startLevel(i));
  else startLevel(i);
}
