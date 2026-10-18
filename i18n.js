'use strict';

// ============================================================
//  Языки интерфейса
// ============================================================
const LANGS = { ru: 'Русский', en: 'English' };

const STR = {
  ru: {
    subtitle: 'Платформер о маленьком храбром роботе',
    play: 'Играть', levels: 'Уровни', shop: 'Магазин', upgrades: 'Улучшения', wheel: 'Колесо фортуны',
    settings: 'Настройки', stats: 'Статистика', controls: 'Управление', sound: 'Звук', music: 'Музыка', back: 'Назад',
    selectLevel: 'Выбор уровня', level: 'Уровень', best: 'Рекорд', target: 'Цель', sec: 'с',
    worlds: ['Зелёные земли', 'Стихии', 'Хаос', 'Небесные острова', 'Кибер-мир'], world: 'Мир',
    run: 'Бег', jumpKey: 'Прыжок (в воздухе — ещё раз)', abilityKey: 'Способность (рывок, удар, бластер…)',
    dropKey: 'Спрыгнуть с тонкой платформы', pauseKey: 'Пауза', restartKey: 'Начать уровень заново',
    howHint1: 'Держи прыжок дольше — прыгнешь выше. Прижмись к стене в полёте, чтобы скользить и отталкиваться. Поддерживаются геймпад и сенсорный экран.',
    howHint2: 'Звёзды: за прохождение, за все монеты и за время быстрее цели.',
    enemies: 'Враги',
    pause: 'Пауза', resume: 'Продолжить', restart: 'Заново', mainMenu: 'Главное меню',
    levelDone: 'Уровень пройден!', gameDone: 'Игра пройдена!', time: 'Время', coins: 'Монеты', goalTime: 'Цель по времени',
    falls: 'Падения', reward: 'Награда', newRecord: 'новый рекорд!', next: 'Дальше', again: 'Ещё раз',
    shopTitle: 'Магазин скинов', shopHint: 'Монеты копятся за прохождение уровней: собранные монеты, побеждённые враги, звёзды и боссы.',
    wheelBanner: 'Колесо фортуны — 3 бесплатные попытки каждый день!',
    selected: 'Выбран', choose: 'Выбрать', beatGame: 'Пройди игру', newSkin: 'Новый скин!', isYours: 'теперь твой',
    needMore: 'Не хватает монет: нужно ещё',
    upTitle: 'Улучшения', upActive: 'Способность на кнопке Shift / X', upPassive: 'Пассивные улучшения',
    buy: 'Купить', upgrade: 'Улучшить', equip: 'Выбрать', equipped: 'Выбрано', max: 'Максимум', lvl: 'Ур.',
    bought: 'Куплено!', upgraded: 'Улучшено!',
    wheelTitle: 'Колесо фортуны', spinsToday: 'Попыток сегодня', inBank: 'в копилке', spin: 'Крутить!',
    spinsTomorrow: 'Новые попытки завтра', toShop: 'В магазин', skinPrize: 'Скин', allSkins: 'Все скины уже твои — держи 200',
    setTitle: 'Настройки', sfxVol: 'Громкость звуков', musicVol: 'Громкость музыки', shake: 'Тряска экрана',
    language: 'Язык', menuStyle: 'Стиль меню', reset: 'Сбросить прогресс',
    resetConfirm: 'Сбросить весь прогресс, монеты, скины и улучшения?',
    styles: { neon: 'Неон-сити', retro: 'Ретро 8-бит', blocks: 'Кубический мир', cartoon: 'Мультик' },
    stTitle: 'Статистика', stBank: 'В копилке', stEarned: 'Всего заработано', stStars: 'Звёзд', stLevels: 'Уровней пройдено',
    stRuns: 'Всего прохождений', stKills: 'Врагов побеждено', stBosses: 'Боссов побеждено', stDeaths: 'Падений',
    stTime: 'Время в игре', stSkins: 'Скинов', hours: 'ч', mins: 'мин',
    checkpoint: 'Чекпоинт!', bossDown: 'Босс повержен!', portalOpen: 'Портал открыт — беги к финишу!',
    bossesNote: 'Каждый 10-й уровень — босс. Ищи момент для удара!',
    enemyNames: {
      walker: ['Ходок', 'Растопчи сверху или пробей способностью'],
      jumper: ['Прыгун', 'Скачет к тебе — растопчи в полёте'],
      spiker: ['Ёж', 'Колючий! Только способностью'],
      charger: ['Таран', 'Разгоняется, заметив тебя'],
      turret: ['Турель', 'Стреляет — перепрыгивай снаряды'],
      flyer: ['Летун', 'Летает по кругу, можно растоптать'],
      swooper: ['Летучая мышь', 'Пикирует, когда ты под ней'],
      ghost: ['Призрак', 'Крадётся, когда ты к нему спиной'],
      saw: ['Пила', 'Неуязвима — обходи'],
      dropper: ['Давилка', 'Падает сверху, на неё можно запрыгнуть'],
      snail: ['Улитка', 'Растопчи и пни панцирь'],
      slime: ['Слизень', 'Делится надвое'],
      spider: ['Паук', 'Спускается на паутине'],
      bomber: ['Гренадёр', 'Кидает бомбы по дуге'],
      launcher: ['Ракетница', 'Самонаводящиеся ракеты можно растоптать'],
    },
    powerups: { shield: ['Щит', 'спасёт от одного удара'], magnet: ['Магнит', 'притягивает монеты'], star: ['Звезда', 'неуязвимость и скорость'] },
  },
  en: {
    subtitle: 'A platformer about a brave little robot',
    play: 'Play', levels: 'Levels', shop: 'Shop', upgrades: 'Upgrades', wheel: 'Wheel of Fortune',
    settings: 'Settings', stats: 'Statistics', controls: 'Controls', sound: 'Sound', music: 'Music', back: 'Back',
    selectLevel: 'Select Level', level: 'Level', best: 'Best', target: 'Target', sec: 's',
    worlds: ['Green Lands', 'Elements', 'Chaos', 'Sky Islands', 'Cyber World'], world: 'World',
    run: 'Run', jumpKey: 'Jump (again in mid-air)', abilityKey: 'Ability (dash, pound, blaster…)',
    dropKey: 'Drop through thin platforms', pauseKey: 'Pause', restartKey: 'Restart level',
    howHint1: 'Hold jump longer to jump higher. Press against a wall in mid-air to slide and kick off. Gamepads and touch screens are supported.',
    howHint2: 'Stars: for finishing, for all coins and for beating the target time.',
    enemies: 'Enemies',
    pause: 'Paused', resume: 'Resume', restart: 'Restart', mainMenu: 'Main menu',
    levelDone: 'Level complete!', gameDone: 'Game complete!', time: 'Time', coins: 'Coins', goalTime: 'Target time',
    falls: 'Falls', reward: 'Reward', newRecord: 'new record!', next: 'Next', again: 'Again',
    shopTitle: 'Skin Shop', shopHint: 'You earn coins by finishing levels: collected coins, defeated enemies, stars and bosses.',
    wheelBanner: 'Wheel of Fortune — 3 free spins every day!',
    selected: 'Selected', choose: 'Select', beatGame: 'Beat the game', newSkin: 'New skin!', isYours: 'is yours now',
    needMore: 'Not enough coins: you need',
    upTitle: 'Upgrades', upActive: 'Ability on Shift / X', upPassive: 'Passive upgrades',
    buy: 'Buy', upgrade: 'Upgrade', equip: 'Equip', equipped: 'Equipped', max: 'Max', lvl: 'Lv.',
    bought: 'Purchased!', upgraded: 'Upgraded!',
    wheelTitle: 'Wheel of Fortune', spinsToday: 'Spins today', inBank: 'in the bank', spin: 'Spin!',
    spinsTomorrow: 'New spins tomorrow', toShop: 'To the shop', skinPrize: 'Skin', allSkins: 'You own every skin — take 200',
    setTitle: 'Settings', sfxVol: 'Sound volume', musicVol: 'Music volume', shake: 'Screen shake',
    language: 'Language', menuStyle: 'Menu style', reset: 'Reset progress',
    resetConfirm: 'Reset all progress, coins, skins and upgrades?',
    styles: { neon: 'Neon City', retro: 'Retro 8-bit', blocks: 'Block World', cartoon: 'Cartoon' },
    stTitle: 'Statistics', stBank: 'In the bank', stEarned: 'Total earned', stStars: 'Stars', stLevels: 'Levels completed',
    stRuns: 'Total runs', stKills: 'Enemies defeated', stBosses: 'Bosses defeated', stDeaths: 'Falls',
    stTime: 'Time played', stSkins: 'Skins', hours: 'h', mins: 'min',
    checkpoint: 'Checkpoint!', bossDown: 'Boss defeated!', portalOpen: 'The portal is open — run to the finish!',
    bossesNote: 'Every 10th level is a boss. Find the right moment to strike!',
    enemyNames: {
      walker: ['Walker', 'Stomp it or hit it with your ability'],
      jumper: ['Jumper', 'Hops towards you — stomp it in the air'],
      spiker: ['Hedgehog', 'Spiky! Ability only'],
      charger: ['Ram', 'Charges when it sees you'],
      turret: ['Turret', 'Shoots — jump over the shots'],
      flyer: ['Flyer', 'Flies in circles, can be stomped'],
      swooper: ['Bat', 'Dives when you are below it'],
      ghost: ['Ghost', 'Sneaks up when your back is turned'],
      saw: ['Saw', 'Indestructible — avoid it'],
      dropper: ['Crusher', 'Falls from above, safe to stand on'],
      snail: ['Snail', 'Stomp it and kick the shell'],
      slime: ['Slime', 'Splits in two'],
      spider: ['Spider', 'Drops down on a thread'],
      bomber: ['Grenadier', 'Throws bombs in an arc'],
      launcher: ['Launcher', 'Homing rockets can be stomped'],
    },
    powerups: { shield: ['Shield', 'saves you from one hit'], magnet: ['Magnet', 'pulls in coins'], star: ['Star', 'invincibility and speed'] },
  },
};

function lang() { return (typeof Save !== 'undefined' && Save.data.lang) || 'ru'; }
function T(key) {
  const v = STR[lang()][key];
  return v !== undefined ? v : (STR.ru[key] !== undefined ? STR.ru[key] : key);
}
// Текст из объекта с вариантами: name / name_en
function tr(obj, field) {
  if (lang() === 'en' && obj[field + '_en']) return obj[field + '_en'];
  return obj[field];
}
function levelName(i) { return tr(LEVELS[i], 'name'); }
function levelTip(i) { return tr(LEVELS[i], 'tip'); }

// Перевод статических надписей с атрибутом data-t
function applyLang() {
  document.documentElement.lang = lang();
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = T(el.dataset.t); });
}
