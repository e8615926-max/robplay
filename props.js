'use strict';

// ============================================================
//  Украшения на поверхности блоков: цветы, грибы, кристаллы,
//  кораллы, бочки, инопланетные растения…
// ============================================================
const PROP_KINDS = {
  0: ['flower', 'flower', 'mushroom', 'bush'],
  1: ['rock', 'drygrass', 'cactus'],
  2: ['glowshroom', 'crystal', 'rock'],
  3: ['cane', 'lolly', 'flower'],
  4: ['glowshroom', 'flower', 'bush'],
  5: ['vent', 'lavarock', 'rock'],
  6: ['fern', 'bush', 'flower'],
  7: ['snowpile', 'pine', 'snowpile'],
  8: ['rock', 'drygrass', 'cactus'],
  9: ['coral', 'shell', 'coral', 'starfish'],
  10: ['barrel', 'cone', 'vent'],
  11: ['alien', 'crystal', 'alien'],
};

function buildProps(L) {
  const kinds = PROP_KINDS[L.def.theme] || PROP_KINDS[0];
  const props = [];
  for (let y = 1; y < L.rows; y++) {
    for (let x = 0; x < L.cols; x++) {
      if (L.grid[y][x] !== '#' || L.grid[y - 1][x] !== ' ') continue;
      const h = hash(x * 7.13 + y * 3.71 + L.index * 11.3);
      if (h > 0.24) continue;
      props.push({
        x: x * TILE + 6 + hash(x + y * 5.1) * 20, y: y * TILE,
        kind: kinds[Math.floor(hash(x * 1.7 + y) * kinds.length)], seed: h * 100,
        hue: Math.floor(hash(x * 3.3 + y * 1.1) * 4),
      });
    }
  }
  return props;
}

function drawProps(L, cam, t) {
  const x0 = cam.x - 40, x1 = cam.x + viewW + 40;
  for (const pr of L.props) {
    if (pr.x < x0 || pr.x > x1) continue;
    const { x, y } = pr;
    const sway = Math.sin(t * 2 + pr.seed) * 0.12;
    ctx.save();
    ctx.translate(x, y);
    switch (pr.kind) {
      case 'flower': {
        ctx.rotate(sway);
        ctx.strokeStyle = '#3b8a3e'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -10); ctx.stroke();
        const col = ['#ff5d73', '#ffd54a', '#b48cff', '#ffffff'][pr.hue];
        ctx.fillStyle = col;
        for (let k = 0; k < 5; k++) { const a = k * 1.256; ctx.beginPath(); ctx.arc(Math.cos(a) * 3, -11 + Math.sin(a) * 3, 2.2, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.arc(0, -11, 1.8, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'mushroom':
        ctx.fillStyle = '#f2e6c9'; ctx.fillRect(-2, -7, 4, 7);
        ctx.fillStyle = '#e8414f'; ctx.beginPath(); ctx.arc(0, -7, 6, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(-3, -10, 2, 2); ctx.fillRect(2, -9, 1.5, 1.5);
        break;
      case 'bush':
        ctx.fillStyle = L.def.theme === 4 ? '#1f5a3a' : '#2f8a3e';
        ctx.beginPath(); ctx.arc(-5, -4, 6, 0, Math.PI * 2); ctx.arc(4, -5, 7, 0, Math.PI * 2); ctx.arc(0, -8, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(-1, -10, 3, 0, Math.PI * 2); ctx.fill();
        break;
      case 'fern':
        ctx.strokeStyle = '#2f7a3e'; ctx.lineWidth = 2;
        for (const s of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 6, -8, s * 9 + sway * 20, -12 + Math.abs(s) * 2); ctx.stroke(); }
        break;
      case 'rock':
        ctx.fillStyle = '#7d7a72';
        ctx.beginPath(); ctx.ellipse(0, -3, 7, 4.5, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(-4, -6, 3, 2);
        break;
      case 'drygrass':
        ctx.strokeStyle = '#c9a463'; ctx.lineWidth = 1.5;
        for (const s of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(s * 2, 0); ctx.lineTo(s * 5 + sway * 15, -9 - (s === 0 ? 3 : 0)); ctx.stroke(); }
        break;
      case 'cactus':
        ctx.fillStyle = '#4f8a52';
        roundRect(ctx, -3, -14, 6, 14, 3); ctx.fill();
        roundRect(ctx, -8, -10, 4, 7, 2); ctx.fill();
        ctx.fillStyle = '#ff7ac8'; ctx.beginPath(); ctx.arc(0, -14, 2, 0, Math.PI * 2); ctx.fill();
        break;
      case 'glowshroom': {
        const a = 0.5 + 0.4 * Math.sin(t * 2.5 + pr.seed);
        ctx.fillStyle = `rgba(120,255,230,${a * 0.35})`;
        ctx.beginPath(); ctx.arc(0, -8, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d8f5ff'; ctx.fillRect(-1.5, -7, 3, 7);
        ctx.fillStyle = `rgba(120,255,230,${0.6 + a * 0.4})`;
        ctx.beginPath(); ctx.arc(0, -7, 5, Math.PI, 0); ctx.fill();
        break;
      }
      case 'crystal': {
        const a = 0.6 + 0.4 * Math.sin(t * 3 + pr.seed);
        const col = L.def.theme === 11 ? '192,140,255' : '122,215,255';
        ctx.fillStyle = `rgba(${col},${a})`;
        ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-2, -12); ctx.lineTo(1, 0); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(3, -8); ctx.lineTo(6, 0); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-2.5, -9, 1, 4);
        break;
      }
      case 'cane':
        ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.strokeStyle = '#fff';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -12); ctx.arc(3, -12, 3, Math.PI, 0); ctx.stroke();
        ctx.strokeStyle = '#ff3d6f'; ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -12); ctx.arc(3, -12, 3, Math.PI, 0); ctx.stroke();
        ctx.setLineDash([]); ctx.lineCap = 'butt';
        break;
      case 'lolly':
        ctx.rotate(sway);
        ctx.fillStyle = '#fff'; ctx.fillRect(-1, -12, 2, 12);
        ctx.fillStyle = ['#ff7ac8', '#6fd3ff', '#ffd54a', '#56e39f'][pr.hue];
        ctx.beginPath(); ctx.arc(0, -14, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, -14, 2.5, t * 2, t * 2 + 4); ctx.stroke();
        break;
      case 'vent': {
        ctx.fillStyle = '#4a3a3a'; ctx.beginPath(); ctx.ellipse(0, -2, 7, 3, 0, Math.PI, 0); ctx.fill();
        for (let k = 0; k < 3; k++) {
          const ph = (t * 0.8 + k / 3 + pr.seed) % 1;
          ctx.fillStyle = `rgba(${L.def.theme === 10 ? '220,220,230' : '120,100,110'},${0.4 * (1 - ph)})`;
          ctx.beginPath(); ctx.arc(Math.sin(ph * 6 + k) * 3, -6 - ph * 30, 3 + ph * 6, 0, Math.PI * 2); ctx.fill();
        }
        break;
      }
      case 'lavarock': {
        ctx.fillStyle = '#3a2a2a';
        ctx.beginPath(); ctx.ellipse(0, -3, 8, 5, 0, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = `rgba(255,140,40,${0.6 + 0.4 * Math.sin(t * 3 + pr.seed)})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(-1, -6); ctx.lineTo(3, -3); ctx.stroke();
        break;
      }
      case 'snowpile':
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(0, 0, 10, 5, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#dbeaf8'; ctx.beginPath(); ctx.ellipse(3, 0, 5, 2.5, 0, Math.PI, 0); ctx.fill();
        break;
      case 'pine':
        ctx.fillStyle = '#2e6b52';
        ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(0, -16); ctx.lineTo(6, -2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-2.5, -10); ctx.lineTo(0, -16); ctx.lineTo(2.5, -10); ctx.fill();
        ctx.fillStyle = '#5a4030'; ctx.fillRect(-1, -2, 2, 2);
        break;
      case 'coral': {
        ctx.strokeStyle = ['#ff7ac8', '#ff8a5d', '#ffd54a', '#b48cff'][pr.hue]; ctx.lineWidth = 3; ctx.lineCap = 'round';
        const s = Math.sin(t * 1.5 + pr.seed) * 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s, -14);
        ctx.moveTo(0, -6); ctx.lineTo(-6 + s, -11); ctx.moveTo(s * 0.5, -9); ctx.lineTo(6 + s, -15); ctx.stroke();
        ctx.lineCap = 'butt';
        break;
      }
      case 'shell':
        ctx.fillStyle = '#ffd6c2';
        ctx.beginPath(); ctx.arc(0, 0, 6, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = '#e09a7a'; ctx.lineWidth = 1;
        for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(k * 2.5, -5.5); ctx.stroke(); }
        break;
      case 'starfish':
        ctx.fillStyle = '#ff8a5d';
        ctx.beginPath();
        for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 2.5 : 6; ctx.lineTo(Math.cos(a) * r, -4 + Math.sin(a) * r); }
        ctx.fill();
        break;
      case 'barrel':
        ctx.fillStyle = '#c9a227'; roundRect(ctx, -6, -14, 12, 14, 2); ctx.fill();
        ctx.fillStyle = '#2b2f40';
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-6 + k * 5, -14); ctx.lineTo(-3 + k * 5, -14); ctx.lineTo(-6 + k * 5, -11); ctx.fill(); }
        ctx.fillRect(-6, -8, 12, 1.5);
        break;
      case 'cone':
        ctx.fillStyle = '#ff8a3d';
        ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(0, -12); ctx.lineTo(5, 0); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(-2.5, -7, 5, 2);
        break;
      case 'alien': {
        ctx.rotate(sway * 1.5);
        ctx.strokeStyle = '#7a4fc0'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(4, -8, 0, -14); ctx.stroke();
        const a = 0.5 + 0.5 * Math.sin(t * 4 + pr.seed);
        ctx.fillStyle = `rgba(143,233,255,${0.3 * a})`;
        ctx.beginPath(); ctx.arc(0, -15, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8fe9ff'; ctx.beginPath(); ctx.arc(0, -15, 3, 0, Math.PI * 2); ctx.fill();
        break;
      }
    }
    ctx.restore();
  }
}
