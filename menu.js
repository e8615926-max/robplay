'use strict';

// ============================================================
//  Собственный анимированный фон главного меню:
//  закат над городом роботов, робот бежит, прыгает и собирает монеты
// ============================================================
const MenuScene = {
  t: 0,
  dist: 0,
  robot: null,
  items: [],      // монеты и препятствия на дороге
  nextItem: 1,

  reset() {
    this.t = 0; this.dist = 0; this.items = []; this.nextItem = 1;
    this.robot = { ...previewPose(0), y: 0, vy: 0, jumps: 0 };
  },

  groundY() { return viewH - 70; },
  robotX() { return Math.max(70, Math.min(viewW * 0.2, viewW / 2 - 230)); },

  update(dt) {
    if (!this.robot) this.reset();
    this.t += dt;
    const speed = 210;
    this.dist += speed * dt;
    const r = this.robot;
    r.runPhase += dt * 14;
    r.blinkT -= dt; if (r.blinkT < -0.12) r.blinkT = rand(1.5, 4);

    // новые предметы
    this.nextItem -= dt;
    if (this.nextItem <= 0) {
      const kind = Math.random() < 0.4 ? 'spike' : 'coins';
      this.items.push({ kind, x: viewW + 40, taken: [false, false, false] });
      this.nextItem = rand(1.1, 2.2);
    }
    const rx = this.robotX();
    for (const it of this.items) {
      it.x -= speed * dt;
      // робот сам прыгает через шипы
      if (it.kind === 'spike' && !it.jumped && it.x - rx < 95 && it.x > rx) {
        it.jumped = true;
        if (r.y === 0) { r.vy = -560; r.jumps = 1; Sound.play('jump'); }
      }
      if (it.kind === 'coins') {
        for (let k = 0; k < 3; k++) {
          const cx = it.x + k * 26, cy = this.groundY() - 24 - Math.sin(k / 2 * Math.PI) * 30;
          if (!it.taken[k] && Math.abs(cx - rx) < 16) {
            if (!it.jumpedC && r.y === 0) { it.jumpedC = true; r.vy = -520; }
            if (Math.abs(cy - (this.groundY() + r.y - 14)) < 30) {
              it.taken[k] = true;
              emit(cx, cy, 8, { color: ['#ffd54a', '#fff6c2'], speed: 150, grav: 200, life: 0.5 });
            }
          }
        }
      }
    }
    this.items = this.items.filter(it => it.x > -120);
    // прыжок
    if (r.y < 0 || r.vy < 0) {
      r.vy += 1700 * dt;
      r.y += r.vy * dt;
      if (r.vy > 0 && r.jumps === 1 && r.y < -40 && Math.random() < 0.02) { r.vy = -380; r.jumps = 0; }
      if (r.y >= 0) { r.y = 0; r.vy = 0; r.sx = 1.25; r.sy = 0.8; }
    }
    r.onGround = r.y === 0;
    r.sx = lerp(r.sx, 1, Math.min(1, dt * 10));
    r.sy = lerp(r.sy, 1, Math.min(1, dt * 10));
    // след скина
    const skin = currentSkin();
    if (skin.trail && Math.random() < dt * 25) {
      skinTrail({ x: rx - 11, y: this.groundY() + r.y - 28, w: 22, h: 28, vx: 200, face: 1, onGround: r.onGround, dead: false }, 1);
    }
    if (Math.random() < dt * 8) {
      emit(rx - 6, this.groundY() + r.y, 1, { color: '#ffffff66', angle: -Math.PI * 0.8, spread: 0.3, speed: 60, grav: 100, life: 0.3, size: 3 });
    }
  },

  // opts: robot, items (по умолчанию да), sky: 'sunset' | 'red' | 'night', dark — погасить окна
  draw(opts = {}) {
    if (!this.robot) this.reset();
    const showRobot = opts.robot !== false, showItems = opts.items !== false;
    const t = this.t || performance.now() / 1000, W = viewW, H = viewH, gy = this.groundY();
    const style = Save.data.menuStyle || 'neon';
    if (style !== 'neon') this.drawStyled(style, t, W, H, gy);
    else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    const pal = { sunset: ['#120b33', '#4a2a7a', '#d9587a', '#ffb36b'], red: ['#1a0308', '#5a0a1a', '#b8202a', '#ff6a3d'], night: ['#03020a', '#0d0a2a', '#1d1645', '#2e2260'] }[opts.sky || 'sunset'];
    sky.addColorStop(0, pal[0]); sky.addColorStop(0.45, pal[1]); sky.addColorStop(0.75, pal[2]); sky.addColorStop(1, pal[3]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    // звёзды
    for (let i = 0; i < 70; i++) {
      ctx.globalAlpha = (0.3 + 0.7 * Math.abs(Math.sin(t * (0.4 + hash(i + 3)) + i))) * 0.9;
      ctx.fillStyle = '#fff';
      ctx.fillRect(hash(i) * W, hash(i + 40) * H * 0.4, 2, 2);
    }
    ctx.globalAlpha = 1;

    // солнце в стиле ретро с полосами
    const sx = W * 0.72, sy = H * (opts.sky === 'night' ? 0.2 : 0.62), sr = Math.min(150, W * 0.16) * (opts.sky === 'night' ? 0.4 : 1);
    const sg = ctx.createLinearGradient(0, sy - sr, 0, sy + sr);
    if (opts.sky === 'night') { sg.addColorStop(0, '#f4f1d0'); sg.addColorStop(1, '#c9c3a0'); }
    else if (opts.sky === 'red') { sg.addColorStop(0, '#ff8a3d'); sg.addColorStop(1, '#7a0a1a'); }
    else { sg.addColorStop(0, '#ffe36b'); sg.addColorStop(1, '#ff5d8f'); }
    ctx.save();
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = sg; ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    ctx.fillStyle = '#d9587a';
    for (let k = 0; k < 6; k++) {
      const y = sy + k * 16 + ((t * 10) % 16), h = 2 + k * 1.6;
      ctx.fillRect(sx - sr, y, sr * 2, h);
    }
    ctx.restore();
    const halo = ctx.createRadialGradient(sx, sy, sr * 0.8, sx, sy, sr * 1.8);
    halo.addColorStop(0, 'rgba(255,170,120,0.35)'); halo.addColorStop(1, 'rgba(255,170,120,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(sx, sy, sr * 1.8, 0, Math.PI * 2); ctx.fill();

    // дальние горы
    const layer = (par, baseY, amp, color, seed) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W + 20; x += 20) {
        const wx = (x + this.dist * par) / 140;
        ctx.lineTo(x, baseY - (Math.sin(wx + seed) * 0.5 + Math.sin(wx * 2.1 + seed) * 0.3 + Math.sin(wx * 0.4) * 0.5) * amp);
      }
      ctx.lineTo(W, H); ctx.fill();
    };
    layer(0.1, H * 0.66, 55, '#5a2f7a', 1);

    // город роботов
    const span = 1400, off = (this.dist * 0.25) % span;
    for (let rep = -1; rep <= Math.ceil(W / span) + 1; rep++) {
      for (let i = 0; i < 14; i++) {
        const bx = rep * span + i * 100 + hash(i) * 30 - off;
        if (bx < -120 || bx > W + 120) continue;
        const bw = 50 + hash(i + 1) * 40, bh = 90 + hash(i + 2) * 170;
        const by = gy - bh;
        ctx.fillStyle = '#2a1745';
        roundRect(ctx, bx, by, bw, bh + 10, 6); ctx.fill();
        // антенна с мигающим огнём
        ctx.fillStyle = '#2a1745'; ctx.fillRect(bx + bw / 2 - 1.5, by - 18, 3, 18);
        ctx.fillStyle = Math.sin(t * 3 + i) > 0.3 ? '#ff4d6d' : '#5a2040';
        ctx.beginPath(); ctx.arc(bx + bw / 2, by - 19, 3, 0, Math.PI * 2); ctx.fill();
        // окна
        for (let wy = by + 12; wy < gy - 16; wy += 18) {
          for (let wx = bx + 8; wx < bx + bw - 12; wx += 14) {
            const on = !opts.dark && hash(i * 31 + wx * 0.7 + wy * 1.3 + Math.floor(t * 0.5 + hash(wx + wy) * 3)) > 0.45;
            ctx.fillStyle = on ? 'rgba(255,214,120,0.85)' : 'rgba(80,50,110,0.8)';
            ctx.fillRect(wx, wy, 7, 9);
          }
        }
        // лицо-визор на некоторых башнях
        if (hash(i + 9) > 0.65) {
          ctx.fillStyle = '#16203f';
          roundRect(ctx, bx + 8, by + 8, bw - 16, 16, 6); ctx.fill();
          ctx.fillStyle = '#8ff7ff';
          const blink = (t + i) % 4 < 0.15;
          ctx.fillRect(bx + bw / 2 - 9, by + (blink ? 15 : 11), 5, blink ? 2 : 8);
          ctx.fillRect(bx + bw / 2 + 4, by + (blink ? 15 : 11), 5, blink ? 2 : 8);
        }
      }
    }
    layer(0.5, H * 0.86, 22, '#3a1d4f', 5);

    // летающие дроны
    for (let i = 0; i < 3; i++) {
      const x = W + 60 - ((t * (50 + i * 15) + i * 500) % (W + 160));
      const y = H * 0.22 + i * 40 + Math.sin(t * 2 + i) * 10;
      ctx.fillStyle = '#c9d1e0';
      roundRect(ctx, x - 10, y - 5, 20, 10, 4); ctx.fill();
      ctx.fillStyle = '#8ff7ff'; ctx.fillRect(x - 6, y - 2, 4, 3);
      ctx.strokeStyle = 'rgba(220,230,255,0.7)'; ctx.lineWidth = 2;
      const pw = Math.abs(Math.sin(t * 40)) * 9;
      ctx.beginPath(); ctx.moveTo(x - 8 - pw, y - 8); ctx.lineTo(x - 8 + pw, y - 8); ctx.moveTo(x + 8 - pw, y - 8); ctx.lineTo(x + 8 + pw, y - 8); ctx.stroke();
    }

    // дорога
    ctx.fillStyle = '#2b2150'; ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = '#ff5d8f'; ctx.fillRect(0, gy, W, 4);
    ctx.fillStyle = '#6fd3ff';
    const dash = (this.dist) % 80;
    for (let x = -dash; x < W; x += 80) ctx.fillRect(x, gy + 26, 40, 4);
    ctx.strokeStyle = 'rgba(255,93,143,0.35)'; ctx.lineWidth = 1;
    for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(0, gy + k * 18); ctx.lineTo(W, gy + k * 18); ctx.stroke(); }

    }

    // монеты и шипы
    for (const it of showItems ? this.items : []) {
      if (it.kind === 'spike') {
        ctx.fillStyle = '#cfd6e6';
        for (let k = 0; k < 3; k++) {
          ctx.beginPath(); ctx.moveTo(it.x + k * 11, gy); ctx.lineTo(it.x + k * 11 + 5.5, gy - 18); ctx.lineTo(it.x + k * 11 + 11, gy); ctx.fill();
        }
      } else {
        for (let k = 0; k < 3; k++) {
          if (it.taken[k]) continue;
          const cx = it.x + k * 26, cy = gy - 24 - Math.sin(k / 2 * Math.PI) * 30;
          const w = Math.abs(Math.cos(t * 3 + k)) * 7 + 1.5;
          ctx.fillStyle = '#e09b00'; ctx.beginPath(); ctx.ellipse(cx, cy, w, 8, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(0.5, w - 2), 6, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    // робот в выбранном скине
    const r = this.robot, rx = this.robotX();
    if (showRobot) { drawRobot(r, rx - 11, gy - 28 + r.y, 1, false, ctx); drawParticles(); }
    if (style === 'retro') {
      // строки развёртки, как на старом телевизоре
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      for (let y = 0; y < canvas.height; y += 4) ctx.fillRect(0, y, canvas.width, 2);
    }
  },

  // Фоны меню в стиле разных игр
  drawStyled(style, t, W, H, gy) {
    const d = this.dist;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    if (style === 'retro') {
      // ---- 8-битная приставка: полосатое небо, ступенчатые горы, кирпичная дорога
      const bands = ['#1d1a4a', '#2b2a7a', '#3d3ca8', '#5c5ccc', '#8a6ad8', '#c07ad0'];
      bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * gy / bands.length, W, gy / bands.length + 1); });
      ctx.fillStyle = '#fce0a8';
      for (let i = 0; i < 40; i++) {
        if (Math.floor(t * 2 + i) % 5 === 0) continue;
        ctx.fillRect(Math.floor(hash(i) * W / 4) * 4, Math.floor(hash(i + 9) * gy * 0.4 / 4) * 4, 4, 4);
      }
      ctx.fillStyle = '#ffe36b';
      ctx.fillRect(W * 0.75, gy * 0.2, 48, 48);
      ctx.fillStyle = '#ffb347'; ctx.fillRect(W * 0.75 + 8, gy * 0.2 + 8, 32, 32);
      const pixMount = (par, baseY, amp, col, seed) => {
        ctx.fillStyle = col;
        const step = 16, off = (d * par) % step;
        for (let x = -off; x < W + step; x += step) {
          const wx = Math.floor((x + d * par) / step);
          const h = Math.floor((Math.sin(wx * 0.35 + seed) * 0.5 + 0.5 + Math.sin(wx * 0.11) * 0.3) * amp / 8) * 8;
          ctx.fillRect(Math.floor(x), baseY - h, step, h + H);
        }
      };
      pixMount(0.15, gy - 40, 160, '#4a3a8a', 1);
      pixMount(0.4, gy, 90, '#2a6a4a', 4);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 4; i++) {
        const x = Math.floor((((i * 380 - d * 0.2) % (W + 200)) + W + 200) % (W + 200) - 100), y = 60 + i * 30;
        ctx.fillRect(x, y, 64, 16); ctx.fillRect(x + 16, y - 16, 32, 16);
      }
      ctx.fillStyle = '#c84c0c'; ctx.fillRect(0, gy, W, H - gy);
      ctx.fillStyle = '#000';
      const off = d % 32;
      for (let y = gy; y < H; y += 16) {
        ctx.fillRect(0, y, W, 2);
        for (let x = -off + ((y - gy) / 16 % 2 ? 16 : 0); x < W; x += 32) ctx.fillRect(x, y, 2, 16);
      }
      ctx.fillStyle = '#fc9838'; ctx.fillRect(0, gy, W, 4);
    } else if (style === 'blocks') {
      // ---- кубический мир: квадратное солнце, блочные облака и рельеф
      const sky = ctx.createLinearGradient(0, 0, 0, gy);
      sky.addColorStop(0, '#78a7ff'); sky.addColorStop(1, '#c4dcff');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff6a8'; ctx.fillRect(W * 0.78, 50, 56, 56);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) {
        const x = (((i * 330 - d * 0.1 - t * 6) % (W + 300)) + W + 300) % (W + 300) - 150;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(x, 70 + i * 22, 120, 24); ctx.fillRect(x + 24, 58 + i * 22, 60, 12);
        ctx.globalAlpha = 1;
      }
      const B = 24;
      const col = (par, base, amp, top, dirt, seed) => {
        const off = (d * par) % B;
        for (let x = -off; x < W + B; x += B) {
          const wx = Math.floor((x + d * par) / B);
          const h = Math.floor((Math.sin(wx * 0.3 + seed) * 0.5 + 0.5 + Math.sin(wx * 0.07) * 0.4) * amp / B) * B;
          const y = base - h;
          ctx.fillStyle = dirt; ctx.fillRect(x, y, B, H);
          ctx.fillStyle = top; ctx.fillRect(x, y, B, 6);
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          for (let yy = y; yy < H; yy += B) ctx.fillRect(x, yy, B, 1), ctx.fillRect(x, yy, 1, B);
          if (par > 0.3 && hash(wx) > 0.88) {
            ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x + 8, y - 48, 8, 48);
            ctx.fillStyle = '#2f7a2f'; ctx.fillRect(x - 12, y - 84, 48, 40);
            ctx.fillStyle = '#3d9a3d'; ctx.fillRect(x - 4, y - 96, 32, 16);
          }
        }
      };
      col(0.15, gy - 70, 180, '#7a8a9a', '#5a6a7a', 2);
      col(0.4, gy - 10, 120, '#5cb84a', '#8a5a34', 7);
      ctx.fillStyle = '#8a5a34'; ctx.fillRect(0, gy, W, H);
      ctx.fillStyle = '#5cb84a'; ctx.fillRect(0, gy, W, 8);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      const off = d % B;
      for (let x = -off; x < W; x += B) ctx.fillRect(x, gy, 1, H);
      for (let y = gy + B; y < H; y += B) ctx.fillRect(0, y, W, 1);
      ctx.fillStyle = '#7a7a7a';
      for (let x = -off; x < W; x += B) if (hash(Math.floor((x + d) / B)) > 0.7) ctx.fillRect(x + 6, gy + 30, 8, 6);
    } else {
      // ---- мультик: яркое небо, солнце с лицом, холмы с глазками, облака
      const sky = ctx.createLinearGradient(0, 0, 0, gy);
      sky.addColorStop(0, '#4fb6ff'); sky.addColorStop(1, '#b8e6ff');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      const sx = W * 0.8, sy = 90;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * 0.3);
      ctx.fillStyle = '#ffd54a';
      for (let k = 0; k < 12; k++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(-6, -40); ctx.lineTo(0, -56); ctx.lineTo(6, -40); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = '#ffe36b'; ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(sx, sy, 38, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3a2a10';
      ctx.beginPath(); ctx.ellipse(sx - 12, sy - 6, 4, 7, 0, 0, Math.PI * 2); ctx.ellipse(sx + 12, sy - 6, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx, sy + 8, 12, 0.2, Math.PI - 0.2); ctx.stroke();
      const cloud = (x, y, s) => {
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2a3a6a'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 22 * s, Math.PI * 0.5, Math.PI * 1.5);
        ctx.arc(x + 26 * s, y - 16 * s, 24 * s, Math.PI, Math.PI * 2);
        ctx.arc(x + 56 * s, y, 22 * s, Math.PI * 1.5, Math.PI * 0.5);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#2a3a6a';
        ctx.fillRect(x + 18 * s, y - 8 * s, 4, 8); ctx.fillRect(x + 32 * s, y - 8 * s, 4, 8);
      };
      for (let i = 0; i < 4; i++) cloud((((i * 360 - d * 0.1 - t * 10) % (W + 300)) + W + 300) % (W + 300) - 150, 80 + (i % 2) * 50, 0.8 + (i % 3) * 0.15);
      const hills = (par, baseY, col, eyes) => {
        const sp = 260, off = (d * par) % sp;
        for (let x = -off - sp; x < W + sp; x += sp) {
          const wx = Math.floor((x + d * par) / sp), h = 90 + hash(wx + par) * 80, w = 150 + hash(wx * 2) * 60;
          ctx.fillStyle = col; ctx.strokeStyle = '#1f4a1f'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(x - w, baseY); ctx.quadraticCurveTo(x, baseY - h * 2, x + w, baseY); ctx.fill(); ctx.stroke();
          if (eyes) {
            const blink = (t + wx) % 4 < 0.15;
            ctx.fillStyle = '#1f2a1f';
            ctx.fillRect(x - 14, baseY - h * 0.75, 6, blink ? 2 : 14); ctx.fillRect(x + 8, baseY - h * 0.75, 6, blink ? 2 : 14);
          }
        }
      };
      hills(0.15, gy - 10, '#7fd36a', false);
      hills(0.4, gy + 10, '#4fbf4a', true);
      ctx.fillStyle = '#c87a3a'; ctx.fillRect(0, gy, W, H);
      ctx.fillStyle = '#5cd04a'; ctx.strokeStyle = '#1f4a1f'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, gy + 12);
      for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, gy + 10 + Math.sin((x + d) * 0.05) * 3);
      ctx.lineTo(W, gy - 2); ctx.lineTo(0, gy - 2); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, gy + 10 + Math.sin((x + d) * 0.05) * 3);
      ctx.stroke();
      ctx.fillStyle = '#a85a2a';
      const off = d % 60;
      for (let x = -off; x < W; x += 60) { ctx.beginPath(); ctx.arc(x + 20, gy + 40, 5, 0, Math.PI * 2); ctx.arc(x + 45, gy + 62, 4, 0, Math.PI * 2); ctx.fill(); }
    }
  },
};
