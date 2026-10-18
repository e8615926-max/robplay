'use strict';

// ============================================================
//  Игроки: у каждого своё имя, скин и сохранение.
//  Игра помнит, кто играл последним, и показывает таблицу рекордов.
// ============================================================
const Profiles = {
  data: { current: null, list: [] },

  load() {
    try {
      const d = JSON.parse(localStorage.getItem('robplay-profiles'));
      if (d && Array.isArray(d.list)) this.data = d;
    } catch (e) { /* хранилище недоступно */ }
    // перенос сохранения из версии без профилей
    if (!this.data.list.length) {
      let old = null;
      try { old = localStorage.getItem('robplay-save'); } catch (e) { /* ignore */ }
      if (old) {
        const p = this.create(T('playerDefault'));
        try { localStorage.setItem(this.saveKey(p.id), old); } catch (e) { /* ignore */ }
      }
    }
    if (this.data.current && !this.get(this.data.current)) this.data.current = this.data.list.length ? this.data.list[0].id : null;
  },

  store() {
    try { localStorage.setItem('robplay-profiles', JSON.stringify(this.data)); } catch (e) { /* ignore */ }
  },

  saveKey(id = this.data.current) { return id ? 'robplay-save-' + id : 'robplay-save'; },
  get(id) { return this.data.list.find(p => p.id === id); },
  current() { return this.get(this.data.current); },

  create(name) {
    const p = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: (name || '').trim().slice(0, 16) || T('playerDefault'),
      created: Date.now(), last: Date.now(), stars: 0, done: 0, coins: 0, earned: 0, skin: 'classic', ach: 0,
    };
    this.data.list.push(p);
    this.data.current = p.id;
    this.store();
    return p;
  },

  select(id) {
    this.data.current = id;
    this.store();
    Save.load();
    this.touch();
  },

  remove(id) {
    this.data.list = this.data.list.filter(p => p.id !== id);
    try { localStorage.removeItem(this.saveKey(id)); } catch (e) { /* ignore */ }
    if (this.data.current === id) this.data.current = this.data.list.length ? this.data.list[0].id : null;
    this.store();
  },

  rename(id, name) {
    const p = this.get(id);
    if (p && name && name.trim()) { p.name = name.trim().slice(0, 16); this.store(); }
  },

  // Краткая сводка для списка игроков и таблицы рекордов
  touch() {
    const p = this.current();
    if (!p) return;
    const d = Save.data;
    let stars = 0, done = 0;
    for (const k in d.best) { stars += d.best[k].stars; done++; }
    Object.assign(p, {
      last: Date.now(), stars, done, coins: d.wallet, earned: d.stats.coins, skin: d.skin,
      ach: Object.keys(d.ach || {}).length,
    });
    this.store();
  },

  // Код для переноса прогресса на другое устройство
  exportCode() {
    const json = JSON.stringify({ v: 1, name: this.current() ? this.current().name : '', save: Save.data });
    return btoa(unescape(encodeURIComponent(json)));
  },
  importCode(code) {
    const o = JSON.parse(decodeURIComponent(escape(atob(code.replace(/\s+/g, '')))));
    if (!o || typeof o.save !== 'object' || !o.save.best) throw new Error('bad code');
    const p = this.create(o.name || T('playerDefault'));
    try { localStorage.setItem(this.saveKey(p.id), JSON.stringify(o.save)); } catch (e) { /* ignore */ }
    Save.load();
    this.touch();
    return p;
  },

  ranking() {
    return [...this.data.list].sort((a, b) => b.stars - a.stars || b.done - a.done || b.earned - a.earned);
  },
};

// ============================================================
//  Достижения (у каждого игрока свои)
// ============================================================
const ACHIEVEMENTS = [
  { id: 'first', icon: 'play', name: 'Первые шаги', name_en: 'First Steps', desc: 'Пройди первый уровень', desc_en: 'Complete the first level', test: d => !!d.best[0] },
  { id: 'world1', icon: 'map', name: 'Путешественник', name_en: 'Traveller', desc: 'Пройди первый мир', desc_en: 'Complete the first world', test: d => [...Array(10).keys()].every(i => d.best[i]) },
  { id: 'boss1', icon: 'crown', name: 'Победитель', name_en: 'Boss Slayer', desc: 'Победи первого босса', desc_en: 'Defeat your first boss', test: d => d.stats.bosses >= 1 },
  { id: 'bossAll', icon: 'crown', name: 'Гроза боссов', name_en: 'Boss Bane', desc: 'Победи всех боссов', desc_en: 'Defeat every boss', test: d => LEVELS.every((l, i) => !l.boss || d.best[i]) },
  { id: 'worldAll', icon: 'trophy', name: 'Легенда', name_en: 'Legend', desc: 'Пройди все уровни', desc_en: 'Complete every level', test: d => LEVELS.every((_, i) => d.best[i]) },
  { id: 'kills100', icon: 'bolt', name: 'Охотник', name_en: 'Hunter', desc: 'Победи 100 врагов', desc_en: 'Defeat 100 enemies', test: d => d.stats.kills >= 100 },
  { id: 'kills1000', icon: 'bolt', name: 'Истребитель', name_en: 'Exterminator', desc: 'Победи 1000 врагов', desc_en: 'Defeat 1000 enemies', test: d => d.stats.kills >= 1000 },
  { id: 'rich', icon: 'coin', name: 'Копилка', name_en: 'Piggy Bank', desc: 'Заработай 1000 монет', desc_en: 'Earn 1000 coins', test: d => d.stats.coins >= 1000 },
  { id: 'richer', icon: 'coin', name: 'Магнат', name_en: 'Tycoon', desc: 'Заработай 10 000 монет', desc_en: 'Earn 10,000 coins', test: d => d.stats.coins >= 10000 },
  { id: 'stars50', icon: 'star', name: 'Звездочёт', name_en: 'Stargazer', desc: 'Собери 50 звёзд', desc_en: 'Collect 50 stars', test: d => Object.values(d.best).reduce((s, b) => s + b.stars, 0) >= 50 },
  { id: 'starsAll', icon: 'star', name: 'Все звёзды', name_en: 'All the Stars', desc: 'Собери все звёзды', desc_en: 'Collect every star', test: d => Object.values(d.best).reduce((s, b) => s + b.stars, 0) >= LEVELS.length * 3 },
  { id: 'perfect', icon: 'check', name: 'Безупречно', name_en: 'Flawless', desc: 'Пройди уровень без падений со всеми монетами', desc_en: 'Finish a level with no falls and every coin', test: d => !!d.flags.perfect },
  { id: 'fashion', icon: 'palette', name: 'Модник', name_en: 'Fashionista', desc: 'Собери 5 скинов', desc_en: 'Own 5 skins', test: d => d.skins.length >= 5 },
  { id: 'maxed', icon: 'upgrade', name: 'Мастер', name_en: 'Master', desc: 'Улучши способность до 3 уровня', desc_en: 'Upgrade an ability to level 3', test: d => Object.values((d.abil || {}).lv || {}).some(v => v >= 3) },
  { id: 'lucky', icon: 'wheel', name: 'Везунчик', name_en: 'Lucky', desc: 'Выиграй 250 монет на колесе', desc_en: 'Win 250 coins on the wheel', test: d => !!d.flags.jackpot },
  { id: 'kicker', icon: 'dash', name: 'Футболист', name_en: 'Striker', desc: 'Сбей врага пинком панциря', desc_en: 'Knock out an enemy with a kicked shell', test: d => !!d.flags.shell },
  { id: 'stubborn', icon: 'deaths', name: 'Упрямый', name_en: 'Stubborn', desc: 'Упади 100 раз и не сдавайся', desc_en: 'Fall 100 times and keep going', test: d => d.stats.deaths >= 100 },
  { id: 'loyal', icon: 'clock', name: 'Верный игрок', name_en: 'Loyal Player', desc: 'Проведи в игре час', desc_en: 'Play for an hour', test: d => d.stats.time >= 3600 },
];

const ACH_REWARD = 25;
let achQueue = [], achShowing = false;

function checkAchievements() {
  const d = Save.data;
  d.ach = d.ach || {};
  d.flags = d.flags || {};
  let got = false;
  for (const a of ACHIEVEMENTS) {
    if (d.ach[a.id] || !a.test(d)) continue;
    d.ach[a.id] = Date.now();
    d.wallet += ACH_REWARD;
    achQueue.push(a);
    got = true;
  }
  if (got) { Save.store(); showNextAchievement(); }
}

function showNextAchievement() {
  if (achShowing || !achQueue.length) return;
  achShowing = true;
  const a = achQueue.shift();
  const el = document.getElementById('ach-pop');
  el.innerHTML = `<div class="ach-icon">${ico(a.icon)}</div><div><small>${T('achUnlocked')}</small><b>${tr(a, 'name')}</b><span>${tr(a, 'desc')} · +${ACH_REWARD} ${ico('coin')}</span></div>`;
  el.classList.remove('hidden');
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  Sound.play('achievement');
  setTimeout(() => { el.classList.add('hidden'); achShowing = false; setTimeout(showNextAchievement, 300); }, 3200);
}
