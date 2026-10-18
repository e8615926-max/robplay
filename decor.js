'use strict';

// ============================================================
//  Анимированные декорации карт и жидкость в пропастях
// ============================================================
const LIQUID = { 5: 'lava', 6: 'water', 7: 'ice', 10: 'goo', 12: 'cloud', 13: 'data' };
const LIQUID_COLORS = {
  lava: ['#ff9a3d', '#e2431f', '#ffd54a'],
  water: ['#4aa3d8', '#2a6a9c', '#bfe6ff'],
  ice: ['#9fd8f0', '#5a9ec4', '#ffffff'],
  goo: ['#8fe36a', '#3f8f2a', '#d9ff9a'],
  cloud: ['#ffffff', '#dfe9f6', '#ffffff'],
  data: ['#00ffc8', '#003a40', '#bafff0'],
};

// Перебор декораций слоя с параллаксом: fn(индекс, экранный x)
function eachDecor(cam, par, spacing, fn) {
  const off = cam.x * par;
  const i0 = Math.floor((off - 200) / spacing), i1 = Math.ceil((off + viewW + 200) / spacing);
  for (let i = i0; i <= i1; i++) fn(i, i * spacing + hash(i * 3.7) * spacing * 0.5 - off);
}

function drawTree(x, base, s, sway, trunk, leaf, leaf2) {
  ctx.save();
  ctx.translate(x, base);
  ctx.fillStyle = trunk;
  ctx.fillRect(-4 * s, -40 * s, 8 * s, 40 * s);
  ctx.rotate(sway);
  ctx.fillStyle = leaf;
  ctx.beginPath(); ctx.arc(0, -52 * s, 24 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-16 * s, -40 * s, 16 * s, 0, Math.PI * 2); ctx.arc(16 * s, -42 * s, 17 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = leaf2;
  ctx.beginPath(); ctx.arc(-6 * s, -60 * s, 10 * s, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawTumbleweed(x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.strokeStyle = '#a77a45'; ctx.lineWidth = 2;
  for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.55, k * 0.63, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}

function drawGear(x, y, r, rot, color) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  const teeth = 10;
  for (let k = 0; k < teeth * 2; k++) {
    const a = k / (teeth * 2) * Math.PI * 2, rr = k % 2 ? r : r * 1.18;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawDecor(L, cam, t) {
  const th = L.def.theme;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const base = viewH * 0.8 - cam.y * 0.15;

  switch (th) {
    case 0: case 6: { // луг и ливень: деревья качаются, птицы летят
      const storm = th === 6;
      eachDecor(cam, 0.45, 230, (i, x) => {
        const s = 0.8 + hash(i) * 0.6;
        const sway = Math.sin(t * (storm ? 2.6 : 1.2) + i) * (storm ? 0.12 : 0.04);
        drawTree(x, base + 10, s, sway, storm ? '#2f2a22' : '#6b4a2b', storm ? '#2e5a3a' : '#3f9a4a', storm ? '#3b6e46' : '#5cc067');
      });
      if (!storm) {
        ctx.strokeStyle = '#2b3a4a'; ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const x = ((t * (35 + i * 6) + i * 420) % (viewW + 200)) - 100;
          const y = 70 + hash(i + 5) * 80 + Math.sin(t * 2 + i) * 8;
          const f = Math.sin(t * 10 + i) * 5;
          ctx.beginPath(); ctx.moveTo(x - 8, y - f); ctx.lineTo(x, y); ctx.lineTo(x + 8, y - f); ctx.stroke();
        }
      }
      break;
    }
    case 1: case 8: { // пустыня: кактусы/пирамиды и перекати-поле
      if (th === 8) {
        eachDecor(cam, 0.2, 650, (i, x) => {
          const s = 0.8 + hash(i) * 0.7;
          ctx.fillStyle = '#c99657';
          ctx.beginPath(); ctx.moveTo(x - 90 * s, base); ctx.lineTo(x, base - 90 * s); ctx.lineTo(x + 90 * s, base); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          ctx.beginPath(); ctx.moveTo(x, base - 90 * s); ctx.lineTo(x + 90 * s, base); ctx.lineTo(x + 20 * s, base); ctx.fill();
        });
      }
      eachDecor(cam, 0.45, 280, (i, x) => {
        if (hash(i + 1) < 0.35) return;
        const s = 0.7 + hash(i) * 0.6;
        ctx.fillStyle = '#4f8a52';
        roundRect(ctx, x - 6 * s, base - 60 * s, 12 * s, 60 * s, 6 * s); ctx.fill();
        roundRect(ctx, x - 20 * s, base - 40 * s, 8 * s, 22 * s, 4 * s); ctx.fill();
        roundRect(ctx, x - 20 * s, base - 24 * s, 16 * s, 7 * s, 3 * s); ctx.fill();
        roundRect(ctx, x + 12 * s, base - 50 * s, 8 * s, 24 * s, 4 * s); ctx.fill();
        roundRect(ctx, x + 4 * s, base - 30 * s, 16 * s, 7 * s, 3 * s); ctx.fill();
      });
      for (let i = 0; i < 3; i++) {
        const sp = th === 8 ? 220 : 110;
        const x = ((t * sp + i * 600) % (viewW + 300)) - 150;
        const y = viewH * 0.86 - Math.abs(Math.sin(t * 3 + i)) * 26;
        drawTumbleweed(x, y, 11 + i * 2, t * 6 + i);
      }
      break;
    }
    case 2: { // пещера: сталактиты, капли, кристаллы
      eachDecor(cam, 0.3, 80, (i, x) => {
        const len = 30 + hash(i) * 70;
        ctx.fillStyle = L.theme.mount2;
        ctx.beginPath(); ctx.moveTo(x - 14, 0); ctx.lineTo(x, len); ctx.lineTo(x + 14, 0); ctx.fill();
        const ph = (t * 0.5 + hash(i + 9)) % 1;
        if (hash(i + 2) > 0.5) {
          ctx.fillStyle = 'rgba(140,210,255,0.7)';
          ctx.fillRect(x - 1.5, len + ph * viewH * 0.7, 3, 6);
        }
      });
      eachDecor(cam, 0.45, 210, (i, x) => {
        const a = 0.45 + 0.35 * Math.sin(t * 2 + i);
        const col = ['122,215,255', '180,140,255', '120,255,200'][Math.abs(i) % 3];
        ctx.fillStyle = `rgba(${col},${a * 0.25})`;
        ctx.beginPath(); ctx.arc(x, base, 34, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(${col},${a})`;
        for (const [dx, h, w] of [[-10, 34, 8], [0, 50, 10], [11, 28, 8]]) {
          ctx.beginPath(); ctx.moveTo(x + dx - w, base); ctx.lineTo(x + dx, base - h); ctx.lineTo(x + dx + w, base); ctx.fill();
        }
      });
      break;
    }
    case 3: { // конфетное небо: леденцы и шарики
      eachDecor(cam, 0.45, 240, (i, x) => {
        const s = 0.8 + hash(i) * 0.5;
        ctx.fillStyle = '#f5e6ff'; ctx.fillRect(x - 2, base - 70 * s, 4, 70 * s);
        ctx.save(); ctx.translate(x, base - 80 * s); ctx.rotate(t * 0.8 + i);
        for (let k = 0; k < 6; k++) {
          ctx.fillStyle = k % 2 ? '#ff7ac8' : '#fff';
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 18 * s, k * Math.PI / 3, (k + 1) * Math.PI / 3); ctx.fill();
        }
        ctx.restore();
      });
      for (let i = 0; i < 7; i++) {
        const x = (hash(i + 30) * (viewW + 100) - cam.x * 0.2 % (viewW + 100) + viewW + 100) % (viewW + 100) - 50;
        const y = viewH + 40 - ((t * (25 + i * 4) + i * 170) % (viewH + 120));
        const col = ['#ff5d73', '#ffd54a', '#6fd3ff', '#56e39f', '#b48cff'][i % 5];
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.quadraticCurveTo(x + Math.sin(t * 2 + i) * 6, y + 30, x, y + 44); ctx.stroke();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.ellipse(x, y, 11, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath(); ctx.ellipse(x - 4, y - 5, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 4: { // ночь: северное сияние
      for (let k = 0; k < 3; k++) {
        const g = ctx.createLinearGradient(0, 20, 0, 170);
        const col = ['86,227,159', '111,211,255', '180,140,255'][k];
        g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.5, `rgba(${col},0.22)`); g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, 170);
        for (let x = 0; x <= viewW + 20; x += 20) {
          ctx.lineTo(x, 50 + k * 18 + Math.sin(x * 0.008 + t * 0.4 + k * 2) * 26 + Math.sin(x * 0.02 - t * 0.7) * 8);
        }
        ctx.lineTo(viewW, 170);
        ctx.fill();
      }
      break;
    }
    case 5: { // вулкан на фоне извергается
      const cx = viewW * 0.72 - cam.x * 0.05, top = viewH * 0.38;
      ctx.fillStyle = '#2a0e16';
      ctx.beginPath(); ctx.moveTo(cx - 260, viewH * 0.85); ctx.lineTo(cx - 40, top); ctx.lineTo(cx + 40, top); ctx.lineTo(cx + 260, viewH * 0.85); ctx.fill();
      const glow = ctx.createRadialGradient(cx, top, 4, cx, top, 90);
      glow.addColorStop(0, 'rgba(255,160,60,0.8)'); glow.addColorStop(1, 'rgba(255,90,40,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, top, 90, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,120,40,0.7)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx - 10, top); ctx.quadraticCurveTo(cx - 30, top + 60, cx - 60 + Math.sin(t) * 5, top + 140); ctx.stroke();
      for (let k = 0; k < 9; k++) {
        const ph = (t * 0.55 + k / 9) % 1;
        const x = cx + (hash(k) - 0.5) * 220 * ph;
        const y = top - Math.sin(ph * Math.PI) * (90 + hash(k + 4) * 80);
        ctx.fillStyle = ph < 0.8 ? '#ffb347' : '#ff5d3d';
        ctx.beginPath(); ctx.arc(x, y, 4 + hash(k + 2) * 4, 0, Math.PI * 2); ctx.fill();
      }
      for (let k = 0; k < 5; k++) {
        const ph = (t * 0.15 + k / 5) % 1;
        ctx.fillStyle = `rgba(60,40,50,${0.5 * (1 - ph)})`;
        ctx.beginPath(); ctx.arc(cx + Math.sin(ph * 4 + k) * 20 + ph * 60, top - 20 - ph * 200, 20 + ph * 40, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 7: { // снежные ели и снеговики
      eachDecor(cam, 0.45, 190, (i, x) => {
        const s = 0.7 + hash(i) * 0.7;
        if (hash(i + 7) < 0.15) {
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(x, base - 14 * s, 16 * s, 0, Math.PI * 2); ctx.arc(x, base - 38 * s, 11 * s, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ff8a3d'; ctx.beginPath(); ctx.moveTo(x, base - 39 * s); ctx.lineTo(x + 10 * s, base - 37 * s); ctx.lineTo(x, base - 35 * s); ctx.fill();
          ctx.fillStyle = '#222'; ctx.fillRect(x - 4 * s, base - 43 * s, 2, 2); ctx.fillRect(x + 2 * s, base - 43 * s, 2, 2);
          return;
        }
        ctx.fillStyle = '#5a4030'; ctx.fillRect(x - 3 * s, base - 12 * s, 6 * s, 12 * s);
        for (let k = 0; k < 3; k++) {
          const w = (34 - k * 8) * s, y = base - 10 * s - k * 22 * s;
          ctx.fillStyle = '#2e6b52';
          ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x, y - 32 * s); ctx.lineTo(x + w, y); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.moveTo(x - w * 0.45, y - 18 * s); ctx.lineTo(x, y - 32 * s); ctx.lineTo(x + w * 0.45, y - 18 * s); ctx.fill();
        }
      });
      break;
    }
    case 9: { // глубина: водоросли и рыбы
      eachDecor(cam, 0.5, 60, (i, x) => {
        const h = 50 + hash(i) * 90;
        ctx.strokeStyle = hash(i + 3) > 0.5 ? '#2f9a6a' : '#1f7a5a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, viewH);
        for (let k = 1; k <= 6; k++) ctx.lineTo(x + Math.sin(t * 1.5 + i + k * 0.7) * k * 2.5, viewH - h * k / 6);
        ctx.stroke(); ctx.lineCap = 'butt';
      });
      for (let i = 0; i < 9; i++) {
        const dir = i % 2 ? 1 : -1, sp = 30 + hash(i) * 40;
        const span = viewW + 200;
        const x = dir > 0 ? ((t * sp + i * 237) % span) - 100 : span - 100 - ((t * sp + i * 237) % span);
        const y = 80 + hash(i + 11) * viewH * 0.55 + Math.sin(t * 2 + i) * 6;
        ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
        ctx.fillStyle = ['#ffb347', '#ffd54a', '#ff7ac8', '#8fe9ff'][i % 4];
        ctx.beginPath(); ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-16, -6 + Math.sin(t * 12 + i) * 2); ctx.lineTo(-16, 6 + Math.sin(t * 12 + i) * 2); ctx.fill();
        ctx.fillStyle = '#111'; ctx.fillRect(4, -2, 2, 2);
        ctx.restore();
      }
      break;
    }
    case 10: { // завод: шестерни, трубы, пар, мигалки
      eachDecor(cam, 0.35, 260, (i, x) => {
        const r = 30 + hash(i) * 30, y = base - 60 - hash(i + 2) * 120;
        drawGear(x, y, r, t * (i % 2 ? 0.6 : -0.6) * (40 / r), '#2a2d3a');
        if (hash(i + 5) > 0.5) drawGear(x + r * 1.6, y + r * 0.4, r * 0.55, -t * 0.6 * (40 / r) * 1.8, '#30344a');
      });
      const py = viewH * 0.32 - cam.y * 0.1;
      ctx.fillStyle = '#2f3240'; ctx.fillRect(0, py, viewW, 14);
      ctx.fillStyle = '#3c4052'; ctx.fillRect(0, py, viewW, 4);
      eachDecor(cam, 1, 300, (i, x) => {
        ctx.fillStyle = '#3c4052'; ctx.fillRect(x - 6, py - 6, 12, 26);
        for (let k = 0; k < 4; k++) {
          const ph = (t * 0.7 + k / 4 + hash(i)) % 1;
          ctx.fillStyle = `rgba(220,220,230,${0.35 * (1 - ph)})`;
          ctx.beginPath(); ctx.arc(x + Math.sin(ph * 5) * 6, py + 20 + ph * 50, 6 + ph * 14, 0, Math.PI * 2); ctx.fill();
        }
        const on = Math.sin(t * 4 + i) > 0;
        ctx.fillStyle = on ? '#ff3b3b' : '#5a1a1a';
        ctx.beginPath(); ctx.arc(x + 150, py - 6, 5, 0, Math.PI * 2); ctx.fill();
        if (on) { ctx.fillStyle = 'rgba(255,60,60,0.25)'; ctx.beginPath(); ctx.arc(x + 150, py - 6, 16, 0, Math.PI * 2); ctx.fill(); }
      });
      break;
    }
    case 12: { // небесные острова: летающие острова с водопадами, мельницы, воздушные шары
      eachDecor(cam, 0.22, 420, (i, x) => {
        const y = 90 + hash(i + 3) * 120 + Math.sin(t * 0.6 + i) * 6, w = 70 + hash(i) * 60;
        ctx.fillStyle = '#b7905a';
        ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w * 0.1, y + w * 0.6); ctx.lineTo(x - w * 0.15, y + w * 0.45); ctx.fill();
        ctx.fillStyle = '#7ccf6a';
        ctx.beginPath(); ctx.ellipse(x, y, w / 2, 9, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(x - w / 2, y - 1, w, 4);
        ctx.fillStyle = 'rgba(160,220,255,0.75)';
        const fx = x + w * 0.3;
        ctx.fillRect(fx, y + 2, 5, 60 + hash(i) * 50);
        for (let k = 0; k < 4; k++) { const ph = (t * 1.4 + k / 4) % 1; ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - ph)})`; ctx.fillRect(fx, y + 4 + ph * 90, 5, 4); }
      });
      eachDecor(cam, 0.45, 300, (i, x) => {
        if (hash(i + 8) < 0.4) return;
        const s = 0.8 + hash(i) * 0.5, top = base - 80 * s;
        ctx.fillStyle = '#efe2c8';
        ctx.beginPath(); ctx.moveTo(x - 12 * s, base); ctx.lineTo(x - 6 * s, top); ctx.lineTo(x + 6 * s, top); ctx.lineTo(x + 12 * s, base); ctx.fill();
        ctx.fillStyle = '#c0644a'; ctx.beginPath(); ctx.moveTo(x - 9 * s, top); ctx.lineTo(x, top - 14 * s); ctx.lineTo(x + 9 * s, top); ctx.fill();
        ctx.save(); ctx.translate(x, top + 4 * s); ctx.rotate(t * 1.4 + i);
        ctx.fillStyle = '#ffffff';
        for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-3 * s, 0, 6 * s, 40 * s); }
        ctx.restore();
      });
      for (let i = 0; i < 3; i++) {
        const x = ((t * (12 + i * 5) + i * 520) % (viewW + 200)) - 100, y = 70 + i * 60 + Math.sin(t + i) * 10;
        ctx.fillStyle = ['#ff7ac8', '#ffd54a', '#6fd3ff'][i];
        ctx.beginPath(); ctx.ellipse(x, y, 16, 19, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - 3, y - 18, 6, 36);
        ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x - 10, y + 14); ctx.lineTo(x - 5, y + 28); ctx.moveTo(x + 10, y + 14); ctx.lineTo(x + 5, y + 28); ctx.stroke();
        ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x - 6, y + 27, 12, 8);
      }
      break;
    }
    case 13: { // кибер-мир: неоновая сетка, каркасные кубы, потоки данных
      const hy = viewH * 0.62;
      ctx.strokeStyle = 'rgba(0,255,200,0.22)'; ctx.lineWidth = 1;
      for (let k = 0; k < 12; k++) {
        const y = hy + Math.pow((k + (t * 0.5) % 1) / 12, 2) * (viewH - hy);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(viewW, y); ctx.stroke();
      }
      const vx0 = viewW / 2 - (cam.x * 0.3) % 80;
      for (let k = -14; k <= 14; k++) {
        ctx.beginPath(); ctx.moveTo(vx0 + k * 40, hy); ctx.lineTo(vx0 + k * 220, viewH); ctx.stroke();
      }
      eachDecor(cam, 0.3, 260, (i, x) => {
        const y = 80 + hash(i + 1) * 150 + Math.sin(t + i) * 10, s = 18 + hash(i) * 14;
        const a = t * (0.6 + hash(i + 2)) + i;
        const pts = [];
        for (const [px, py, pz] of [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]) {
          const rx = px * Math.cos(a) - pz * Math.sin(a), rz = px * Math.sin(a) + pz * Math.cos(a);
          const ry = py * Math.cos(a * 0.7) - rz * Math.sin(a * 0.7);
          pts.push([x + rx * s, y + ry * s]);
        }
        ctx.strokeStyle = i % 2 ? 'rgba(255,60,200,0.6)' : 'rgba(0,255,200,0.6)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (const [p0, p1] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) {
          ctx.moveTo(pts[p0][0], pts[p0][1]); ctx.lineTo(pts[p1][0], pts[p1][1]);
        }
        ctx.stroke();
      });
      eachDecor(cam, 0.5, 90, (i, x) => {
        if (hash(i + 4) < 0.6) return;
        ctx.fillStyle = 'rgba(0,255,200,0.12)'; ctx.fillRect(x, 0, 2, viewH);
        const ph = (t * 0.6 + hash(i)) % 1;
        ctx.fillStyle = 'rgba(180,255,240,0.8)'; ctx.fillRect(x - 1, ph * viewH, 4, 14);
      });
      break;
    }
    case 11: { // космос: планета с кольцом и спутник
      const px = viewW * 0.22 - cam.x * 0.03, py = viewH * 0.3;
      const g = ctx.createRadialGradient(px - 20, py - 20, 10, px, py, 70);
      g.addColorStop(0, '#ffb3e0'); g.addColorStop(1, '#6b3fc4');
      ctx.strokeStyle = 'rgba(255,220,180,0.6)'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.ellipse(px, py, 110, 26, -0.3, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 64, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(px, py, 110, 26, -0.3, 0, Math.PI); ctx.stroke();
      const a = t * 0.5;
      const sx = px + Math.cos(a) * 140, sy = py + Math.sin(a) * 50;
      ctx.fillStyle = '#c9d1e0'; ctx.fillRect(sx - 5, sy - 4, 10, 8);
      ctx.fillStyle = '#4a7bd0'; ctx.fillRect(sx - 18, sy - 3, 11, 6); ctx.fillRect(sx + 7, sy - 3, 11, 6);
      ctx.fillStyle = Math.sin(t * 6) > 0 ? '#ff3b3b' : '#552';
      ctx.fillRect(sx - 1, sy - 8, 2, 3);
      const ex = viewW * 0.85 - cam.x * 0.02, ey = viewH * 0.55;
      ctx.fillStyle = '#3a7bd5'; ctx.beginPath(); ctx.arc(ex, ey, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#56e39f';
      ctx.beginPath(); ctx.ellipse(ex - 6 + Math.sin(t * 0.3) * 4, ey - 4, 8, 5, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(ex + 8 + Math.sin(t * 0.3) * 4, ey + 8, 6, 4, -0.3, 0, Math.PI * 2); ctx.fill();
      break;
    }
  }
}

// Жидкость в пропастях (рисуется в мировых координатах)
function drawLiquid(L, cam, t) {
  const kind = LIQUID[L.def.theme];
  if (!kind) return;
  const [c1, c2, c3] = LIQUID_COLORS[kind];
  const top = L.h - 20;
  if (top > cam.y + viewH + 40) return;
  const x0 = Math.max(0, Math.floor(cam.x / TILE)), x1 = Math.min(L.cols - 1, Math.ceil((cam.x + viewW) / TILE));
  const g = ctx.createLinearGradient(0, top, 0, top + 140);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  for (let tx = x0; tx <= x1; tx++) {
    if (L.grid[L.rows - 1][tx] === '#') continue;
    const x = tx * TILE;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, top + 600);
    for (let k = 0; k <= 4; k++) {
      const wx = x + k * 8;
      ctx.lineTo(wx, top + Math.sin(t * 2.5 + wx * 0.06) * 3 + Math.sin(t * 1.3 + wx * 0.02) * 2);
    }
    ctx.lineTo(x + TILE, top + 600);
    ctx.fill();
    ctx.fillStyle = c3;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(x, top + Math.sin(t * 2.5 + x * 0.06) * 3 - 1, TILE, 2);
    ctx.globalAlpha = 1;
    if (kind === 'cloud') {
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x + 6 + k * 10, top + 4 + Math.sin(t * 1.5 + tx + k) * 3, 10, 0, Math.PI * 2); ctx.fill(); }
    }
    if (kind === 'lava' || kind === 'goo' || kind === 'data') {
      const ph = (t * 0.8 + hash(tx)) % 1;
      if (ph < 0.3) {
        ctx.fillStyle = c3;
        ctx.beginPath(); ctx.arc(x + 8 + hash(tx + 1) * 16, top + 4 - ph * 20, 3 + ph * 6, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  if (kind === 'lava') {
    // свечение над лавой
    const gl = ctx.createLinearGradient(0, top - 80, 0, top);
    gl.addColorStop(0, 'rgba(255,120,40,0)'); gl.addColorStop(1, 'rgba(255,120,40,0.25)');
    ctx.fillStyle = gl;
    for (let tx = x0; tx <= x1; tx++) if (L.grid[L.rows - 1][tx] !== '#') ctx.fillRect(tx * TILE, top - 80, TILE, 80);
  }
}
