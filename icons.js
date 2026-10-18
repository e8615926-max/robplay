'use strict';

// ============================================================
//  Собственный набор иконок вместо эмодзи.
//  Каждая иконка — слои в сетке 24×24: [путь, цвет, режим, толщина].
//  Режим: 'fill' (по умолчанию), 'stroke', 'evenodd'.
//  Одни и те же иконки рисуются и в интерфейсе (SVG), и на холсте игры.
// ============================================================
const circ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
const poly = pts => 'M' + pts.map(p => p.join(' ')).join('L') + 'z';
const starPath = (cx, cy, R, r, n = 5) => {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R;
    pts.push([+(cx + Math.cos(a) * rr).toFixed(2), +(cy + Math.sin(a) * rr).toFixed(2)]);
  }
  return poly(pts);
};
const gearPath = (cx, cy, R, r, teeth) => {
  const pts = [];
  for (let i = 0; i < teeth * 4; i++) {
    const a = i / (teeth * 4) * Math.PI * 2, rr = (i % 4 < 2) ? R : r;
    pts.push([+(cx + Math.cos(a) * rr).toFixed(2), +(cy + Math.sin(a) * rr).toFixed(2)]);
  }
  return poly(pts);
};
const CC = 'currentColor';

const ICONS = {
  coin: [[circ(12, 12, 10), '#d18a00'], [circ(12, 12, 7.6), '#ffd54a'], ['M10.6 7.2h2.8v9.6h-2.8z', '#fff3b0'], [circ(8.5, 8.5, 1.3), '#ffffff', 'fill']],
  star: [[starPath(12, 12.6, 11, 4.9), '#ffc21a'], [starPath(12, 12.4, 7, 3.2), '#ffe27a']],
  starOff: [[starPath(12, 12.6, 11, 4.9), '#3a4570']],
  heart: [['M12 21s-7.6-4.6-9.6-9.3C1.1 8.5 3 5 6.6 5c2 0 3.4 1.1 5.4 3.2C14 6.1 15.4 5 17.4 5c3.6 0 5.5 3.5 4.2 6.7C19.6 16.4 12 21 12 21z', '#ff4d6d'], [circ(7.5, 9, 1.8), '#ffb3c1']],
  heartOff: [['M12 21s-7.6-4.6-9.6-9.3C1.1 8.5 3 5 6.6 5c2 0 3.4 1.1 5.4 3.2C14 6.1 15.4 5 17.4 5c3.6 0 5.5 3.5 4.2 6.7C19.6 16.4 12 21 12 21z', '#3a4570']],
  deaths: [['M12 2.5v3', CC, 'stroke', 2], [circ(12, 2.5, 1.6), CC], ['M5 6h14a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 19 20H5a2.5 2.5 0 0 1-2.5-2.5v-9A2.5 2.5 0 0 1 5 6z', CC],
    ['M6.5 10.5l3 3M9.5 10.5l-3 3M14.5 10.5l3 3M17.5 10.5l-3 3', '#1b2040', 'stroke', 1.8], ['M8.5 17h7', '#1b2040', 'stroke', 1.6]],
  clock: [[circ(12, 12, 10) + circ(12, 12, 7.8), CC, 'evenodd'], ['M12 7v5.2l3.4 2', CC, 'stroke', 2.2]],
  pause: [['M6.5 5h4v14h-4zM13.5 5h4v14h-4z', CC]],
  play: [['M8 4.5l12 7.5-12 7.5z', CC]],
  map: [['M2.5 6l6.5-2.3 6 2.3 6.5-2.3v14.3L15 20.3 9 18l-6.5 2.3z', CC], ['M9 3.8V18M15 6v14.2', 'rgba(0,0,0,0.35)', 'stroke', 1.4], ['M5 9l2 1.5M11 11.5l2 2M17 8.5l1.5 2', 'rgba(0,0,0,0.3)', 'stroke', 1.2]],
  cart: [['M2.5 4.5h3l2.4 10h10.4l2.2-7.3H7', CC, 'stroke', 2.2], [circ(9, 19, 1.9) + circ(17, 19, 1.9), CC]],
  gear: [[gearPath(12, 12, 10.5, 7.8, 8) + circ(12, 12, 3.2), CC, 'evenodd']],
  chart: [['M3 21h18', CC, 'stroke', 2], ['M5 13h3.6v6H5zM10.2 7h3.6v12h-3.6zM15.4 10h3.6v9h-3.6z', CC]],
  gamepad: [['M7 7.5h10a5 5 0 0 1 4.7 6.8l-1 2.5a2.6 2.6 0 0 1-4.3.7L14.6 15H9.4l-1.8 2.5a2.6 2.6 0 0 1-4.3-.7l-1-2.5A5 5 0 0 1 7 7.5z', CC],
    ['M6.3 9.8h1.6v1.6h1.6V13H7.9v1.6H6.3V13H4.7v-1.6h1.6z', 'rgba(0,0,0,0.4)'], [circ(16, 10.8, 1.1) + circ(18.2, 13, 1.1), 'rgba(0,0,0,0.4)']],
  wheel: [[circ(12, 12, 11), '#2a1745'], ['M12 12L12 2.5A9.5 9.5 0 0 1 21.5 12z', '#e0559a'], ['M12 12L21.5 12A9.5 9.5 0 0 1 12 21.5z', '#f0b72f'],
    ['M12 12L12 21.5A9.5 9.5 0 0 1 2.5 12z', '#3fa7e0'], ['M12 12L2.5 12A9.5 9.5 0 0 1 12 2.5z', '#2fbf73'], [circ(12, 12, 2.6), '#fff3b0'], ['M10 0.5h4l-2 4z', '#ff3d5a']],
  sound: [['M3 9h4l5-4.2v14.4L7 15H3z', CC], ['M15.2 8.6a4.6 4.6 0 0 1 0 6.8M18 5.8a8.5 8.5 0 0 1 0 12.4', CC, 'stroke', 2]],
  soundOff: [['M3 9h4l5-4.2v14.4L7 15H3z', CC], ['M15.5 9l6 6M21.5 9l-6 6', CC, 'stroke', 2.2]],
  music: [['M9 17.5V5.5l11-2.2v12', CC, 'stroke', 2.2], [circ(6.6, 17.6, 2.8) + circ(17.6, 15.4, 2.8), CC]],
  lock: [['M8 11V8a4 4 0 0 1 8 0v3', CC, 'stroke', 2.4], ['M5.5 10.5h13a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5V12a1.5 1.5 0 0 1 1.5-1.5z', CC], [circ(12, 15.5, 1.6), 'rgba(0,0,0,0.4)']],
  crown: [[poly([[2.5, 7.5], [7.5, 12], [12, 4.5], [16.5, 12], [21.5, 7.5], [19.5, 18.5], [4.5, 18.5]]), '#ffc21a'], ['M4.5 18.5h15v2h-15z', '#d18a00'], [circ(12, 14.2, 1.7), '#ff3d7f'], [circ(7, 15, 1.1) + circ(17, 15, 1.1), '#6fd3ff']],
  check: [['M4.5 12.5l5 5L19.5 7', CC, 'stroke', 3.2]],
  back: [['M15 4.5L7.5 12l7.5 7.5', CC, 'stroke', 3]],
  next: [['M9 4.5l7.5 7.5L9 19.5', CC, 'stroke', 3]],
  refresh: [['M19.5 12a7.5 7.5 0 1 1-2.2-5.3', CC, 'stroke', 2.4], [poly([[20.5, 2.5], [21, 9.5], [14, 9]]), CC]],
  trash: [['M3.5 6.5h17', CC, 'stroke', 2.2], ['M9 6.5V3.8h6v2.7', CC, 'stroke', 2], ['M5.8 8h12.4l-1 12.5H6.8z', CC], ['M10 10.5v7.5M14 10.5v7.5', 'rgba(0,0,0,0.35)', 'stroke', 1.5]],
  globe: [[circ(12, 12, 10) + circ(12, 12, 8), CC, 'evenodd'], ['M12 2.5c-3.5 3.2-3.5 15.8 0 19M12 2.5c3.5 3.2 3.5 15.8 0 19M2.5 12h19M4 7.5h16M4 16.5h16', CC, 'stroke', 1.5]],
  palette: [['M12 2.5a9.5 9.5 0 0 0 0 19c1.6 0 2.2-1 2.2-2 0-1.2-1.1-1.6-1.1-2.7 0-1.2 1-2 2.6-2h2.1a3.7 3.7 0 0 0 3.7-3.7C21.5 6.4 17.3 2.5 12 2.5z', CC],
    [circ(7.2, 11.5, 1.7), '#ff5d73'], [circ(9.5, 7, 1.7), '#ffd54a'], [circ(14.5, 6.6, 1.7), '#56e39f'], [circ(17.6, 10.4, 1.7), '#6fd3ff']],
  style: [['M12 2.5l10 5-10 5-10-5z', CC], ['M2 12l10 5 10-5M2 16.5l10 5 10-5', CC, 'stroke', 2]],
  trophy: [['M7 3h10v5.5a5 5 0 0 1-10 0z', '#ffc21a'], ['M7 5H3.5v1.5A3.5 3.5 0 0 0 7 10M17 5h3.5v1.5A3.5 3.5 0 0 1 17 10', '#ffc21a', 'stroke', 1.8], ['M10.8 13.5h2.4v4h-2.4z', '#d18a00'], ['M7.5 18h9v3h-9z', '#d18a00']],
  upgrade: [['M12 2.5l8 8.5h-4.5v10h-7v-10H4z', CC]],
  shield: [['M12 2l8.5 3.2v6.3c0 5.4-3.6 9.6-8.5 11.3-4.9-1.7-8.5-5.9-8.5-11.3V5.2z', '#3fa7e0'], ['M12 4.3l6.2 2.3v5c0 4-2.5 7.3-6.2 8.8z', '#a8e6ff']],
  magnet: [['M6.5 4v8.5a5.5 5.5 0 0 0 11 0V4', '#ff4d6d', 'stroke', 4.6], ['M4.2 2.5h4.6v4H4.2zM15.2 2.5h4.6v4h-4.6z', '#e8ecf4']],
  bolt: [[poly([[13.5, 1.5], [4, 13.8], [11, 13.8], [9.8, 22.5], [20, 9.5], [13, 9.5]]), '#ffc21a'], [poly([[13.5, 1.5], [8, 9.5], [12.2, 9.5]]), '#fff3b0']],
  pound: [['M9 1.5h6v8.5h4.5L12 18.5 4.5 10H9z', '#ff8a3d'], ['M2.5 21.5h19', CC, 'stroke', 2.2], ['M5 19l-2-2.5M19 19l2-2.5', CC, 'stroke', 1.6]],
  blaster: [['M2.5 8.5h12.5l2-2h3v6.5h-3l-2-2h-2.5l-1.2 6.5H7.8l1.2-6.5H2.5z', '#8fe9ff'], ['M2.5 8.5h12.5v2H2.5z', '#d8fbff'], [circ(22, 9.8, 1.6), '#ffd54a']],
  glide: [['M1.5 11a10.5 8.5 0 0 1 21 0z', '#ff7ac8'], ['M8.5 11a3.5 6 0 0 1 7 0z', '#ffd54a'], ['M2 11l10 8.5M22 11l-10 8.5M12 11v8.5', CC, 'stroke', 1.2], ['M10 18.5h4v4h-4z', CC]],
  blink: [[circ(12, 12, 10) + circ(12, 12, 6), '#b48cff', 'evenodd'], [circ(12, 12, 3.6), '#ece0ff'], ['M3 4l2 2M21 4l-2 2M3 20l2-2M21 20l-2-2', '#e0d0ff', 'stroke', 1.6]],
  jumps: [['M5.5 13l6.5-6.5 6.5 6.5M5.5 20l6.5-6.5 6.5 6.5', '#56e39f', 'stroke', 3]],
  speed: [['M2 8h10M1 12h13M2 16h10', CC, 'stroke', 2], [poly([[14, 4.5], [22.5, 12], [14, 19.5]]), '#6fd3ff']],
  dash: [['M2 9h8M1 13h8M2 17h7', CC, 'stroke', 1.8], [poly([[12, 5], [22, 12], [12, 19], [14, 12]]), '#ffc21a']],
  left: [['M16.5 4l-10 8 10 8z', CC]],
  right: [['M7.5 4l10 8-10 8z', CC]],
  down: [['M4 7.5l8 10 8-10z', CC]],
  up: [['M4 16.5l8-10 8 10z', CC]],
  jump: [['M12 2.5l7.5 8.5H15v6H9v-6H4.5z', CC], ['M5 20.5h14', CC, 'stroke', 2.4]],
  edit: [['M4 20l1-4.5L15.5 5l3.5 3.5L8.5 19z', CC], ['M14 6.5l3.5 3.5', 'rgba(0,0,0,0.35)', 'stroke', 1.4], ['M17 3.5l3.5 3.5', CC, 'stroke', 2.4]],
  robot: [['M12 2v3.5', CC, 'stroke', 2], [circ(12, 2.4, 1.6), '#ffd54a'], ['M5 6.5h14a2.5 2.5 0 0 1 2.5 2.5v9a2.5 2.5 0 0 1-2.5 2.5H5A2.5 2.5 0 0 1 2.5 18V9A2.5 2.5 0 0 1 5 6.5z', CC], ['M6.5 10h11v5h-11z', '#16203f'], ['M9 11.2h1.8v2.6H9zM13.2 11.2H15v2.6h-1.8z', '#8ff7ff']],
  ghostIcon: [['M4 21V11a8 8 0 0 1 16 0v10l-2.7-2-2.6 2-2.7-2-2.6 2-2.7-2z', CC], [circ(9, 11, 1.5) + circ(15, 11, 1.5), '#1b2040']],
};

const _pathCache = new Map();
function iconPath(d) {
  let p = _pathCache.get(d);
  if (!p) { p = new Path2D(d); _pathCache.set(d, p); }
  return p;
}

// SVG-разметка иконки для интерфейса
function ico(name, cls = '') {
  const layers = ICONS[name];
  if (!layers) return '';
  const body = layers.map(([d, color, mode, w]) => {
    if (mode === 'stroke') return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w || 2}" stroke-linecap="round" stroke-linejoin="round"/>`;
    return `<path d="${d}" fill="${color}"${mode === 'evenodd' ? ' fill-rule="evenodd"' : ''}/>`;
  }).join('');
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
}

// Иконка на холсте: центр (x, y), размер size
function drawIcon(c, name, x, y, size, color = '#ffffff') {
  const layers = ICONS[name];
  if (!layers) return;
  c.save();
  c.translate(x - size / 2, y - size / 2);
  c.scale(size / 24, size / 24);
  for (const [d, col, mode, w] of layers) {
    const fill = col === CC ? color : col;
    if (mode === 'stroke') {
      c.strokeStyle = fill; c.lineWidth = w || 2; c.lineCap = 'round'; c.lineJoin = 'round';
      c.stroke(iconPath(d));
    } else {
      c.fillStyle = fill;
      c.fill(iconPath(d), mode === 'evenodd' ? 'evenodd' : 'nonzero');
    }
  }
  c.restore();
}

// Заменяет <i data-ic="имя"></i> на SVG-иконки
function renderIcons(root = document) {
  root.querySelectorAll('i[data-ic]').forEach(el => {
    el.outerHTML = ico(el.dataset.ic, el.className);
  });
}
