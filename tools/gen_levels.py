import json
class L:
    def __init__(s,w,h=15): s.w=w; s.h=h; s.g=[[' ']*w for _ in range(h)]
    def rect(s,x,y,w,h,c='#'):
        for yy in range(y,y+h):
            for xx in range(x,x+w):
                if 0<=yy<s.h and 0<=xx<s.w: s.g[yy][xx]=c
    def ground(s,x0,x1,top=12): s.rect(x0,top,x1-x0,s.h-top)
    def put(s,x,y,c): s.g[y][x]=c
    def row(s,x,y,c,n):
        for i in range(n): s.g[y][x+i]=c
    def coins(s,pts):
        for x,y in pts: s.put(x,y,'C')
    def out(s): return [''.join(r).rstrip() for r in s.g]

levels=[]
# ---- 1
l=L(112)
l.ground(0,41); l.put(2,11,'P')
l.coins([(8,10),(9,10),(10,10)])
l.rect(16,10,3,2); l.put(17,8,'C')
l.rect(22,9,4,3); l.coins([(23,7),(24,7)])
l.put(33,11,'E')
l.ground(44,71); l.coins([(42,9),(43,8)])
l.rect(52,7,2,5); l.coins([(52,4),(53,4)])
l.row(59,8,'=',6); l.coins([(60,7),(61,7),(62,7),(63,7)])
l.put(67,11,'E')
l.ground(75,112); l.coins([(72,9),(73,9)])
l.put(78,11,'K')
l.rect(83,10,4,2); l.rect(89,8,4,4); l.coins([(90,6),(91,6)])
l.put(97,11,'E')
l.put(106,11,'G')
levels.append(dict(name='Первые шаги',par=40,theme=0,
  tip='← → или A D — бег, Пробел / W — прыжок. В воздухе можно прыгнуть ещё раз!',map=l.out()))
# ---- 2
l=L(132)
l.ground(0,21); l.put(2,11,'P'); l.row(10,11,'^',3); l.coins([(10,8),(11,8),(12,8)])
l.ground(25,29,10); l.coins([(26,8),(27,8)])
l.ground(32,61); l.row(35,11,'^',6); l.row(35,8,'=',4); l.coins([(36,7),(37,7)])
l.put(48,11,'E'); l.put(56,11,'E')
l.row(61,12,'X',9); l.coins([(63,10),(65,10),(67,10)])
l.ground(70,96); l.put(72,11,'K'); l.put(80,11,'E'); l.put(91,11,'E')
l.rect(85,9,2,3); l.put(85,8,'C'); l.put(86,8,'C')
l.row(98,9,'=',3); l.row(102,6,'=',3); l.coins([(99,8),(103,5)])
l.ground(106,116,7); l.row(109,6,'^',2); l.coins([(108,5),(111,5)])
l.ground(116,132); l.put(120,11,'E'); l.coins([(117,10),(118,10)])
l.put(127,11,'G')
l.put(44, 11, '!')
levels.append(dict(name='Шипы и обрывы',par=55,theme=1,
  tip='Осторожно с шипами! Ломкие блоки рушатся под ногами — не стой на месте. ↓ — спрыгнуть с тонкой платформы.',map=l.out()))
# ---- 3 (tall)
H=24
l=L(72,H)
l.ground(0,72,22); l.put(2,21,'P')
l.coins([(6,20),(8,20)])
l.rect(12,4,2,15)       # left wall, gap under rows 19-21
l.rect(17,6,2,16)       # right wall
l.rect(19,6,8,1)        # ledge
for y in (17,14,11,8): l.put(15,y,'C')
l.coins([(21,5),(23,5),(25,5)])
l.put(30,21,'K')
l.rect(36,0,1,17)       # pillar, open below
l.rect(40,10,6,12)      # tower
for y in (18,15,12): l.put(38,y,'C')
l.put(43,9,'E')
l.row(47,21,'^',7); l.row(49,16,'=',3); l.put(50,15,'C')
l.put(60,21,'E'); l.coins([(56,20),(57,20)])
l.put(67,21,'G')
levels.append(dict(name='Прыжки по стенам',par=50,theme=2,
  tip='Прижмись к стене в прыжке — робот заскользит. Жми прыжок, чтобы оттолкнуться и забраться выше!',map=l.out()))
# ---- 4
l=L(142)
l.ground(0,18); l.put(2,11,'P'); l.put(13,11,'B'); l.rect(16,4,2,8)
l.coins([(13,7),(13,5)])
l.put(22,9,'M'); l.put(28,8,'M'); l.coins([(22,7),(28,6)])
l.ground(32,51); l.put(34,11,'K'); l.put(41,8,'F'); l.put(46,11,'E')
l.put(54,10,'V'); l.coins([(54,5)])
l.ground(58,71,6); l.put(62,3,'F'); l.coins([(60,5),(64,5),(68,5)])
l.rect(75,13,1,2); l.put(75,12,'B'); l.rect(81,13,1,2); l.put(81,12,'B')
l.coins([(75,6),(78,4),(81,6)])
l.ground(86,111); l.row(93,11,'^',4); l.put(94,8,'F'); l.put(102,11,'E'); l.put(88,11,'K')
l.put(114,10,'M'); l.put(121,9,'M'); l.coins([(114,8),(121,7)])
l.ground(126,142); l.put(137,11,'G')
l.put(38, 11, '&')
levels.append(dict(name='Пружины и лифты',par=60,theme=3,
  tip='Прыгни на пружину, чтобы взлететь высоко. Летающих врагов тоже можно растоптать сверху!',map=l.out()))
# ---- 5
l=L(152)
l.ground(0,21); l.put(2,11,'P'); l.coins([(23,9),(24,8),(25,9)])
l.ground(28,61); l.rect(44,0,7,11); l.put(48,11,'E'); l.coins([(45,11),(46,11),(50,11)])
l.coins([(62,9),(64,8),(66,9)])
l.ground(68,123); l.put(72,11,'K'); l.row(84,11,'^',10); l.row(88,7,'=',2); l.coins([(86,8),(89,6),(92,8)])
l.put(100,11,'E'); l.put(105,8,'F')
l.ground(110,123,12)
# islands over pit
for i in range(110,123): 
    for y in range(12,15): l.g[y][i]=' '
l.ground(110,112,12)
l.rect(118,10,2,1); l.rect(125,8,2,1); l.rect(132,10,2,1)
l.coins([(118,9),(125,7),(132,9)])
l.ground(138,152); l.put(140,8,'F'); l.put(147,11,'G')
l.put(75, 11, '*')
levels.append(dict(name='Рывок',par=55,theme=4,
  tip='Shift / X — твоя способность (по умолчанию рывок). Антенна светится жёлтым, когда она готова.',map=l.out()))
# ---- 6 (tall finale)
H=20
l=L(182,H)
T=17
l.ground(0,20,T); l.put(2,T-1,'P'); l.row(9,T-1,'^',3); l.put(15,T-1,'E')
l.row(20,T,'X',8); l.coins([(22,T-2),(25,T-2)])
l.ground(28,46,T); l.put(30,T-1,'K')
l.rect(34,3,2,11)  # left wall, gap under
l.rect(39,5,2,12)  # right wall
for y in (13,10,7): l.put(37,y,'C')
l.rect(41,5,5,1); l.put(44,4,'C')
l.put(50,8,'M'); l.put(57,10,'M'); l.coins([(50,6),(57,8)])
l.ground(61,82,T); l.put(63,T-1,'K'); l.put(70,T-1,'B'); l.rect(73,7,2,10)
l.coins([(70,10),(70,7)])
l.put(78,T-1,'E')
l.row(82,T,'X',4); l.ground(86,90,T)
l.coins([(91,13),(93,12),(95,13)])
l.ground(97,130,T); l.put(101,T-1,'K'); l.rect(110,0,6,T-1); l.put(113,T-1,'E'); l.coins([(111,T-1),(114,T-1)])
l.row(119,T-1,'^',8); l.put(123,9,'F'); l.row(121,12,'=',3)
l.put(134,12,'V'); l.ground(138,150,10); l.put(143,9,'E'); l.coins([(134,7),(140,9),(146,9)])
l.put(154,9,'B'); l.put(155,9,'B'); l.rect(154,10,2,10)
l.put(160,6,'F'); l.coins([(158,4),(162,4)])
l.ground(163,182,T); l.put(168,T-1,'K'); l.put(174,T-1,'E'); l.put(178,T-1,'G')
l.put(65, T - 1, '!')
levels.append(dict(name='Финальный забег',par=90,theme=5,
  tip='Всё, чему ты научился — в одном уровне. Удачи, робот!',map=l.out()))


# ============================================================
#  Генератор уровней 7–30 из проверенных «кусков»
# ============================================================
import random

# Враги, которые открываются по мере прохождения (номер уровня с 1)
GROUND_POOL = [(1, 'E'), (7, 'J'), (8, 'S'), (11, 'H'), (11, 'N'), (12, 'Y'), (17, 'A'),
               (51, 'L'), (55, '1'), (57, '2'), (61, '3')]
AIR_POOL = [(1, 'F'), (9, 'W'), (14, 'U'), (18, 'Q'), (53, 'I')]
POWERUPS = '!&*'   # щит, магнит, звезда


class Gen:
    def __init__(s, num, seed, diff, mods):
        s.num, s.diff, s.mods = num, diff, mods
        s.rng = random.Random(seed)
        s.l = L(700)
        s.x = 0

    def pool(s, table):
        return [c for lvl, c in table if s.num >= lvl]

    def e(s, x, y=11):  # наземный враг
        s.l.put(x, y, s.rng.choice(s.pool(GROUND_POOL)))

    def a(s, x, y):  # летающий враг
        s.l.put(x, y, s.rng.choice(s.pool(AIR_POOL)))

    def flat(s, w):
        s.l.ground(s.x, s.x + w); s.x += w

    # ---- куски: каждый начинается после земли и заканчивается землёй (верх = ряд 12)
    def p(s, x, y):  # бонус
        s.l.put(x, y, s.rng.choice(POWERUPS))

    def c_run(s):
        w = s.rng.randint(10, 14); x = s.x
        s.flat(w)
        s.l.coins([(x + i, 10) for i in range(3, 6)])
        if s.rng.random() < 0.15: s.p(x + 1, 11)
        s.e(x + w - 3)
        if s.diff >= 2: s.e(x + w // 2)
        if s.num > 30: s.e(x + 3)
        if s.num > 50 and w >= 13: s.e(x + 7)
        if s.diff >= 2 and s.rng.random() < 0.6:
            s.l.row(x + 5, 8, '=', 4); s.l.coins([(x + 6, 7), (x + 7, 7)])
            s.a(x + 8, 5)

    def c_gap(s):
        n = s.rng.randint(2, 4); x = s.x
        s.l.coins([(x + n // 2, 9)]); s.x += n; s.flat(3)

    def c_double_gap(s):
        n = s.rng.randint(5, 6); x = s.x
        s.l.coins([(x + 1, 9), (x + n // 2, 7), (x + n - 2, 9)])
        if s.diff >= 3: s.a(x + n // 2, 3)
        s.x += n; s.flat(4)

    def c_dash_gap(s):
        n = s.rng.randint(7, 8); x = s.x
        s.l.coins([(x + 2, 9), (x + 4, 8), (x + 6, 9)]); s.x += n; s.flat(4)

    def c_stairs(s):
        x = s.x; s.flat(16)
        s.l.rect(x + 2, 10, 3, 2); s.l.rect(x + 6, 8, 4, 4); s.l.rect(x + 11, 10, 3, 2)
        s.l.coins([(x + 7, 6), (x + 8, 6)])
        if s.diff >= 2: s.e(x + 8, 7)

    def c_spikes(s):
        x = s.x; n = s.rng.randint(3, 5); s.flat(n + 8)
        s.l.row(x + 4, 11, '^', n); s.l.coins([(x + 4 + n // 2, 8)])
        if n > 4: s.l.row(x + 4 + n // 2 - 1, 8, '=', 2)

    def c_pillars(s):
        x = s.x
        for i in range(3):
            top = 10 if i % 2 == 0 else 9
            s.l.rect(x + 3 + i * 5, top, 2, 15 - top); s.l.put(x + 3 + i * 5, top - 1, 'C')
        s.x += 3 + 3 * 5; s.flat(3)

    def c_crumble(s):
        n = s.rng.randint(6, 9); x = s.x
        s.l.row(x, 12, 'X', n); s.l.coins([(x + 2, 10), (x + n - 2, 10)]); s.x += n; s.flat(3)

    def c_moving(s):
        x = s.x
        s.l.put(x + 3, 9, 'M'); s.l.put(x + 9, 9, 'M'); s.l.coins([(x + 3, 7), (x + 9, 7)])
        if s.diff >= 2: s.a(x + 6, 4)
        s.x += 12; s.flat(4)

    def c_lift(s):
        x = s.x
        s.l.put(x + 3, 9, 'V'); s.l.ground(x + 6, x + 15, 6); s.l.coins([(x + 3, 4), (x + 10, 5), (x + 12, 5)])
        if s.diff >= 2: s.e(x + 13, 5)
        s.x += 15; s.flat(4)

    def c_spring(s):
        x = s.x; s.flat(13)
        s.l.put(x + 2, 11, 'B'); s.l.rect(x + 5, 4, 2, 8); s.l.coins([(x + 2, 7), (x + 2, 5)])

    def c_shaft(s):
        x = s.x; s.flat(13)
        s.l.rect(x + 3, 2, 2, 8); s.l.rect(x + 8, 4, 2, 8)
        s.l.coins([(x + 6, 9), (x + 6, 7), (x + 6, 5), (x + 7, 2)])

    def c_tunnel(s):
        x = s.x; s.flat(13)
        s.l.rect(x + 3, 0, 7, 11); s.l.coins([(x + 4, 11), (x + 6, 11), (x + 8, 11)])
        if s.diff >= 2: s.l.put(x + 7, 11, 'E')

    def c_turret(s):
        x = s.x; s.flat(17)
        s.l.put(x + 15, 11, 'T'); s.l.row(x + 5, 8, '=', 5); s.l.coins([(x + 6, 7), (x + 8, 7)])

    def c_dropper(s):
        x = s.x; s.flat(15)
        s.l.put(x + 4, 3, 'D'); s.l.put(x + 10, 3, 'D'); s.l.coins([(x + 4, 11), (x + 10, 11)])

    def c_saw(s):
        x = s.x; s.flat(15)
        s.l.row(x + 6, 11, '^', 3); s.l.put(x + 7, 7, 'O'); s.l.coins([(x + 7, 9)])

    def c_air(s):
        x = s.x; s.flat(15)
        s.l.row(x + 4, 8, '=', 6); s.l.coins([(x + 5, 7), (x + 7, 7)])
        s.a(x + 7, 4); s.e(x + 12)

    def c_zigzag(s):
        x = s.x
        for i, y in enumerate((10, 8, 10)):
            s.l.row(x + 1 + i * 4, y, '=', 3); s.l.put(x + 2 + i * 4, y - 1, 'C')
        if s.diff >= 2: s.a(x + 6, 4)
        s.x += 13; s.flat(4)

    def c_bounce_chain(s):
        x = s.x
        for px in (x + 3, x + 9):
            s.l.rect(px, 13, 2, 2); s.l.put(px, 12, 'B'); s.l.put(px + 1, 12, 'B')
            s.l.coins([(px, 7), (px + 1, 5)])
        s.l.coins([(x + 6, 3), (x + 12, 3)])
        s.x += 14; s.flat(4)

    def c_gauntlet(s):
        x = s.x; s.flat(18)
        for k in (5, 10, 15): s.e(x + k)
        s.l.coins([(x + k, 9) for k in (4, 8, 12, 16)])
        s.l.row(x + 7, 8, '=', 4)

    def c_bonus(s):
        x = s.x; s.flat(12)
        for k, y in enumerate((10, 8, 7, 6, 7, 8, 10)): s.l.put(x + 2 + k, y, 'C')
        s.p(x + 5, 11)

    def c_rockets(s):
        x = s.x; s.flat(17)
        s.l.rect(x + 15, 10, 1, 2); s.l.put(x + 15, 9, 'R')
        s.l.row(x + 4, 8, '=', 4); s.l.coins([(x + 5, 7), (x + 9, 10)])

    def c_checkpoint(s):
        x = s.x; s.flat(5); s.l.put(x + 2, 11, 'K')

    def build(s, n):
        s.flat(7); s.l.put(2, 11, 'P')
        # новый враг появляется сразу после старта уровня, где о нём подсказка
        intro = {51: ('L', 11), 53: ('I', 8), 55: ('1', 11), 57: ('2', 11), 61: ('3', 11)}.get(s.num)
        if intro:
            x = s.x; s.flat(10); s.l.put(x + 7, intro[1], intro[0]); s.l.coins([(x + 3, 9), (x + 4, 9)])
        m = s.mods
        table = [  # (кусок, мин. сложность, вес)
            (s.c_run, 1, 3), (s.c_gap, 1, 3), (s.c_double_gap, 1, 2), (s.c_stairs, 1, 2),
            (s.c_spikes, 1, 2), (s.c_pillars, 1, 2), (s.c_crumble, 1, 2), (s.c_moving, 1, 2),
            (s.c_air, 1, 2), (s.c_tunnel, 2, 1), (s.c_dash_gap, 2, 2), (s.c_lift, 2, 1),
            (s.c_spring, 1, 1), (s.c_shaft, 2, 1),
        ]
        if s.num >= 8: table.append((s.c_turret, 1, 2))
        if s.num >= 13: table.append((s.c_dropper, 1, 2))
        if s.num >= 15: table.append((s.c_saw, 1, 2))
        if s.num >= 19: table.append((s.c_rockets, 1, 2))
        table += [(s.c_zigzag, 1, 2), (s.c_gauntlet, 2, 2), (s.c_bonus, 1, 1)]
        if not m.get('lowGrav'): table.append((s.c_bounce_chain, 1, 1))
        if m.get('ice'): table = [t for t in table if t[0] not in (s.c_dash_gap, s.c_shaft, s.c_crumble)]
        if m.get('lowGrav'): table = [t for t in table if t[0] is not s.c_spring]
        table = [t for t in table if t[1] <= s.diff]
        last = None
        for i in range(n):
            if i and i % 4 == 0: s.c_checkpoint()
            while True:
                fn = s.rng.choices([t[0] for t in table], [t[2] for t in table])[0]
                if fn is not last: break
            last = fn
            fn()
            if not s.l.g[12][s.x - 1] == '#': s.flat(2)
        s.flat(10); s.l.put(s.x - 5, 11, 'G')
        out = s.l.out()
        return [r[:s.x] for r in out]


def boss_arena(kind):
    l = L(38)
    l.ground(0, 38); l.put(2, 11, 'P'); l.put(35, 11, 'G'); l.put(26, 11, 'Z')
    if kind == 1:
        l.row(7, 8, '=', 4); l.row(27, 8, '=', 4); l.coins([(8, 7), (28, 7)])
    elif kind == 2:
        l.put(5, 11, 'B'); l.put(32, 11, 'B'); l.row(12, 7, '=', 4); l.row(22, 7, '=', 4)
        l.coins([(13, 6), (23, 6)])
    elif kind == 3:
        l.row(5, 8, '=', 4); l.row(16, 6, '=', 6); l.row(29, 8, '=', 4)
        l.coins([(6, 7), (18, 5), (30, 7)])
    elif kind == 4:
        l.put(3, 11, 'B'); l.put(34, 11, 'B')
        l.row(6, 8, '=', 4); l.row(28, 8, '=', 4); l.row(16, 6, '=', 6)
        l.coins([(7, 7), (29, 7), (18, 5), (19, 5)])
    elif kind == 5:
        l.row(5, 9, '=', 4); l.row(29, 9, '=', 4); l.row(15, 6, '=', 8)
        l.put(11, 11, '!')
        l.coins([(6, 8), (30, 8), (17, 5), (20, 5)])
    elif kind == 6:
        l.row(7, 8, '=', 5); l.row(26, 8, '=', 5)
        l.put(10, 11, '!')
        l.coins([(8, 7), (27, 7), (19, 9)])
    else:
        l.row(4, 9, '=', 4); l.row(30, 9, '=', 4); l.row(11, 6, '=', 4); l.row(23, 6, '=', 4); l.row(17, 3, '=', 4)
        l.put(18, 11, '!'); l.put(8, 11, '&')
        l.coins([(5, 8), (31, 8), (12, 5), (24, 5), (18, 2)])
    return l.out()


NEW = [
    # номер, название, подсказка, тема, сложность, кусков, модификаторы
    (7, 'Прыгучий лес', 'Новый враг: лягушка-прыгун! Она скачет к тебе — растопчи её сверху.', 0, 1, 9, {}),
    (8, 'Ливень', 'Ежи-колючки не боятся прыжков на голову — их берёт только способность. Турели стреляют: прыгай через снаряды!', 6, 1, 10, {}),
    (9, 'Тёмные пещеры', 'Здесь темно! Летучие мыши пикируют сверху, когда ты проходишь под ними.', 2, 1, 10, {'dark': True}),
    (10, 'БОСС: Громобот', 'Прыгай Громоботу на голову! Перепрыгивай ударные волны, когда он приземляется.', 10, 0, 0, {'boss': 1}),
    (11, 'Ледяной перевал', 'Лёд скользкий — разгоняйся и тормози заранее. Новые враги: таран бросается в атаку, а улитку можно растоптать и пнуть её панцирь!', 7, 2, 10, {'ice': True}),
    (12, 'Снежная буря', 'Снег слепит глаза. Слизни делятся на двух малышей, если на них прыгнуть!', 7, 2, 11, {}),
    (13, 'Песчаная буря', 'Каменные давилки падают сверху — проскочи под ними быстро! На них можно прыгать сверху.', 8, 2, 11, {}),
    (14, 'Миражи пустыни', 'Жаркие пески. Пауки спускаются на паутине — проходи, когда они наверху.', 8, 2, 12, {}),
    (15, 'Грозовые пики', 'Циркулярные пилы неуязвимы — просто держись подальше.', 6, 2, 12, {}),
    (16, 'Глубины', 'Под водой всё легче: прыжки выше и падение медленнее.', 9, 2, 12, {'lowGrav': True}),
    (17, 'Конфетные облака', 'Сладкое, но опасное небо. Гренадёры кидают бомбы по дуге!', 3, 2, 12, {}),
    (18, 'Дом с привидениями', 'Призраки крадутся, только когда ты стоишь к ним спиной! Способности развеивают их.', 2, 2, 12, {'dark': True}),
    (19, 'Звёздная ночь', 'Последний рубеж перед вторым боссом. Ракетницы пускают самонаводящиеся ракеты — их можно растоптать!', 4, 2, 13, {}),
    (20, 'БОСС: Буревестник', 'Туча кидает бомбы. Когда она рухнет на землю и оглохнет — прыгай ей на голову!', 6, 0, 0, {'boss': 2}),
    (21, 'Старый завод', 'Свет погас, искры летят...', 10, 3, 12, {'dark': True}),
    (22, 'Открытый космос', 'Невесомость! Прыжки очень высокие.', 11, 3, 13, {'lowGrav': True}),
    (23, 'Лавовые реки', 'Жарко! Всё против тебя.', 5, 3, 13, {}),
    (24, 'Ледник', 'Скользко и опасно.', 7, 3, 13, {'ice': True}),
    (25, 'Затонувший город', 'Глубоко под водой.', 9, 3, 14, {'lowGrav': True}),
    (26, 'Конвейер', 'Завод работает на полную.', 10, 3, 14, {}),
    (27, 'Буря в пустыне', 'Песок застилает всё вокруг.', 8, 3, 14, {}),
    (28, 'Бездна', 'Кромешная тьма и призраки.', 2, 3, 14, {'dark': True}),
    (29, 'Сердце вулкана', 'Последний шаг до Ядра Хаоса.', 5, 3, 15, {}),
    (30, 'БОСС: Ядро Хаоса', 'Ядро защищено щитом. Когда оно устанет и опустится — бей прыжком или способностью!', 11, 0, 0, {'boss': 3}),
    (31, 'Облачные острова', 'Мир 4: Небесные острова. Пружины и платформы унесут тебя под самые облака!', 12, 3, 14, {}),
    (32, 'Ветряные мельницы', 'Высоко и ветрено. Не смотри вниз!', 12, 3, 14, {}),
    (33, 'Золотые шпили', 'Стражи небесной крепости не дремлют.', 12, 3, 15, {}),
    (34, 'Звёздный мост', 'Здесь почти нет гравитации — прыгай смело.', 12, 3, 15, {'lowGrav': True}),
    (35, 'Радужная дорога', 'Сладкий путь между облаками.', 3, 3, 15, {}),
    (36, 'Небесная крепость', 'Крепость полна ловушек.', 12, 3, 16, {}),
    (37, 'Грозовой фронт', 'Молнии сверкают совсем рядом.', 6, 3, 16, {}),
    (38, 'Ледяные облака', 'Облака замёрзли — держи равновесие!', 12, 3, 16, {'ice': True}),
    (39, 'Врата дракона', 'Впереди логово Механического Змея.', 12, 3, 17, {}),
    (40, 'БОСС: Механический Змей', 'Змей неуязвим, пока летает. Когда он рухнет и оглушённо ляжет — прыгай на голову! Тело сверху безопасно.', 12, 0, 0, {'boss': 4}),
    (41, 'Вход в Сеть', 'Мир 5: Кибер-мир. Ты внутри компьютера!', 13, 3, 15, {}),
    (42, 'Поток данных', 'Данные несутся со скоростью света.', 13, 3, 15, {}),
    (43, 'Брандмауэр', 'Система отключила свет. Будь осторожен.', 13, 3, 16, {'dark': True}),
    (44, 'Глюк', 'Пол стал скользким от ошибок.', 13, 3, 16, {'ice': True}),
    (45, 'Лабиринт кода', 'Вирусы повсюду.', 13, 3, 16, {}),
    (46, 'Нулевая гравитация', 'Сектор без гравитации.', 13, 3, 16, {'lowGrav': True}),
    (47, 'Вирусная зона', 'Самые опасные программы собрались здесь.', 13, 3, 17, {}),
    (48, 'Ядро сервера', 'Тьма и шум вентиляторов.', 13, 3, 17, {'dark': True}),
    (49, 'Последний байт', 'Остался один шаг до Омеги.', 13, 3, 18, {}),
    (50, 'БОСС: Омега', 'Омега стреляет лазерами — следи за красной линией и уходи с неё! Бей, когда Омега устанет.', 13, 0, 0, {'boss': 5}),
    (51, 'Дикие джунгли', 'Мир 6: Джунгли. Новый враг: глаз-лазер — следи за красной линией и не стой на ней!', 14, 3, 15, {}),
    (52, 'Лианы', 'Джунгли полны опасностей.', 14, 3, 15, {}),
    (53, 'Древний храм', 'Плавающие мины пищат, когда ты рядом, — убегай или обезвредь способностью!', 14, 3, 16, {'dark': True}),
    (54, 'Болото', 'Не упади в трясину.', 14, 3, 16, {}),
    (55, 'Водопады', 'Черепаха прикрыта щитом спереди: прыгай сверху или бей со спины.', 14, 3, 16, {}),
    (56, 'Тропа хищников', 'Хищники выходят на охоту.', 14, 3, 17, {'lowGrav': True}),
    (57, 'Затерянный город', 'Ниндзя-боты прыгают и бросают сюрикены!', 14, 3, 17, {'dark': True}),
    (58, 'Вершина джунглей', 'Высоко над деревьями.', 14, 3, 17, {}),
    (59, 'Логово короля', 'Король Джунглей уже близко.', 14, 3, 18, {}),
    (60, 'БОСС: Король Джунглей', 'Король швыряет бочки и прыгает через арену. Когда он устанет и сядет — прыгай на голову!', 14, 0, 0, {'boss': 6}),
    (61, 'Тёмная цитадель', 'Мир 7: Тёмная цитадель. Тени-клоны быстры — будь начеку!', 15, 3, 16, {}),
    (62, 'Залы теней', 'Тьма сгущается.', 15, 3, 16, {'dark': True}),
    (63, 'Огненный мост', 'Мост над бездной.', 15, 3, 17, {}),
    (64, 'Зеркальный лабиринт', 'Скользкий зеркальный пол.', 15, 3, 17, {'ice': True}),
    (65, 'Башня ветров', 'Почти невесомость.', 15, 3, 17, {'lowGrav': True}),
    (66, 'Темница', 'Глубоко под цитаделью.', 15, 3, 18, {'dark': True}),
    (67, 'Тронный зал', 'Стража цитадели не дремлет.', 15, 3, 18, {}),
    (68, 'Грань хаоса', 'Всё, что ты встречал, — здесь.', 15, 3, 18, {}),
    (69, 'Последняя лестница', 'Последний шаг до твоей тени.', 15, 3, 19, {}),
    (70, 'ФИНАЛ: Тёмный Роб', 'Твоя тень повторяет твои способности: рывок, бластер, телепорт. После рывка она теряется — бей!', 15, 0, 0, {'boss': 7}),
]

EN = {
    1: ('First Steps', '← → or A D — run, Space / W — jump. You can jump again in mid-air!'),
    2: ('Spikes and Cliffs', 'Watch out for spikes! Cracked blocks crumble under your feet — keep moving. ↓ — drop through thin platforms.'),
    3: ('Wall Jumps', 'Press against a wall in mid-air to slide. Press jump to kick off and climb higher!'),
    4: ('Springs and Lifts', 'Jump on a spring to fly high. You can stomp flying enemies too!'),
    5: ('Dash', 'Shift / X — your ability (dash by default). The antenna glows yellow when it is ready.'),
    6: ('Final Run', 'Everything you have learned in one level. Good luck, robot!'),
    7: ('Bouncy Forest', 'New enemy: the jumping frog! It hops towards you — stomp it.'),
    8: ('Downpour', 'Spiky hedgehogs ignore stomps — only an ability defeats them. Turrets shoot: jump over the shots!'),
    9: ('Dark Caves', 'It is dark here! Bats dive at you when you walk below them.'),
    10: ('BOSS: Thunderbot', 'Jump on Thunderbot\'s head! Jump over the shockwaves when he lands.'),
    11: ('Icy Pass', 'Ice is slippery — speed up and brake early. New: the ram charges when it sees you, and snails hide in shells you can kick!'),
    12: ('Snowstorm', 'Snow blinds you. Slimes split into two little ones when stomped!'),
    13: ('Sandstorm', 'Stone crushers fall from above — run under them quickly! You can jump on top of them.'),
    14: ('Desert Mirages', 'Hot sands. Spiders drop down on threads — pass when they are up.'),
    15: ('Thunder Peaks', 'Saw blades cannot be destroyed — keep away from them.'),
    16: ('The Deep', 'Everything is lighter underwater: higher jumps and slower falls.'),
    17: ('Candy Clouds', 'Sweet but dangerous sky. Grenadiers throw bombs in an arc!'),
    18: ('Haunted House', 'Ghosts sneak up only when your back is turned! Abilities scatter them.'),
    19: ('Starry Night', 'The last stretch before the second boss. Rocket launchers fire homing rockets — you can stomp them!'),
    20: ('BOSS: Stormbird', 'The cloud drops bombs. When it crashes down and is stunned — jump on its head!'),
    21: ('Old Factory', 'The lights are out and sparks are flying...'),
    22: ('Outer Space', 'Zero gravity! Very high jumps.'),
    23: ('Lava Rivers', 'It is hot! Everything is against you.'),
    24: ('Glacier', 'Slippery and dangerous.'),
    25: ('Sunken City', 'Deep underwater.'),
    26: ('Conveyor', 'The factory is running at full power.'),
    27: ('Desert Storm', 'Sand covers everything.'),
    28: ('The Abyss', 'Pitch darkness and ghosts.'),
    29: ('Heart of the Volcano', 'One step from the Chaos Core.'),
    30: ('BOSS: Chaos Core', 'The Core has a shield. When it gets tired and sinks down — hit it with a jump or your ability!'),
    31: ('Cloud Islands', 'World 4: Sky Islands. Springs and platforms will carry you up to the clouds!'),
    32: ('Windmills', 'High and windy. Do not look down!'),
    33: ('Golden Spires', 'The guards of the sky fortress never sleep.'),
    34: ('Star Bridge', 'There is almost no gravity here — jump boldly.'),
    35: ('Rainbow Road', 'A sweet path between the clouds.'),
    36: ('Sky Fortress', 'The fortress is full of traps.'),
    37: ('Storm Front', 'Lightning strikes very close.'),
    38: ('Frozen Clouds', 'The clouds have frozen — keep your balance!'),
    39: ('Dragon Gate', 'The Mecha Serpent\'s lair lies ahead.'),
    40: ('BOSS: Mecha Serpent', 'The Serpent is invulnerable while flying. When it crashes and lies stunned — jump on its head! Its body is safe from above.'),
    41: ('Network Entry', 'World 5: Cyber World. You are inside a computer!'),
    42: ('Data Stream', 'Data rushes by at the speed of light.'),
    43: ('Firewall', 'The system turned off the lights. Be careful.'),
    44: ('Glitch', 'The floor became slippery with errors.'),
    45: ('Code Maze', 'Viruses everywhere.'),
    46: ('Zero-G Sector', 'A sector without gravity.'),
    47: ('Virus Zone', 'The most dangerous programs gathered here.'),
    48: ('Server Core', 'Darkness and the hum of fans.'),
    49: ('Last Byte', 'One step left to Omega.'),
    50: ('BOSS: Omega', 'Omega fires lasers — watch the red line and get off it! Strike when Omega is tired.'),
    51: ('Wild Jungle', 'World 6: Jungle. New enemy: the laser eye — watch the red line and do not stand on it!'),
    52: ('Vines', 'The jungle is full of dangers.'),
    53: ('Ancient Temple', 'Floating mines beep when you are close — run or defuse them with your ability!'),
    54: ('Swamp', 'Do not fall into the bog.'),
    55: ('Waterfalls', 'The turtle is shielded in front: jump on it or hit it from behind.'),
    56: ('Predator Trail', 'The predators are out hunting.'),
    57: ('Lost City', 'Ninja bots jump and throw shurikens!'),
    58: ('Jungle Peak', 'High above the trees.'),
    59: ("King's Lair", 'The Jungle King is near.'),
    60: ('BOSS: Jungle King', 'The King throws barrels and leaps across the arena. When he gets tired and sits down — jump on his head!'),
    61: ('Dark Citadel', 'World 7: Dark Citadel. Shadow clones are fast — stay alert!'),
    62: ('Halls of Shadow', 'The darkness thickens.'),
    63: ('Fire Bridge', 'A bridge over the abyss.'),
    64: ('Mirror Maze', 'A slippery mirror floor.'),
    65: ('Tower of Winds', 'Almost weightless.'),
    66: ('Dungeon', 'Deep beneath the citadel.'),
    67: ('Throne Hall', 'The citadel guards never sleep.'),
    68: ('Edge of Chaos', 'Everything you have met is here.'),
    69: ('Final Staircase', 'One step from your shadow.'),
    70: ('FINAL: Shadow Rob', 'Your shadow copies your abilities: dash, blaster, blink. After a dash it is dazed — strike!'),
}
# Нумерация лиги: уровни 1–6 сделаны вручную выше
for num, name, tip, theme, diff, chunks, mods in NEW:
    if mods.get('boss'):
        m = boss_arena(mods['boss']); par = 90
    else:
        m = Gen(num, 1000 + num * 7, diff, mods).build(chunks)
        par = int(max(len(r) for r in m) * 0.27 + 12)
    lv = dict(name=name, par=par, theme=theme, tip=tip, map=m)
    lv.update(mods)
    levels.append(lv)

for i, lv in enumerate(levels):
    lv['name_en'], lv['tip_en'] = EN[i + 1]

with open('levels.js', 'w') as f:
    f.write('// Карты уровней (сгенерировано tools/gen_levels.py). Символы:\n')
    f.write('//  # блок   = тонкая платформа   ^ шипы   X ломкий блок   B пружина\n')
    f.write('//  P старт  C монета  K чекпоинт  G финиш  M/V движущиеся платформы\n')
    f.write('//  Враги: E ходок  F летун  J прыгун  S ёж  H таран  T турель\n')
    f.write('//         W летучая мышь  Q призрак  O пила  D давилка  Z босс\n')
    f.write('//         N улитка  Y слизень  U паук  A гренадёр  R ракетница\n')
    f.write('//         L глаз-лазер  I мина  1 черепаха  2 ниндзя  3 тень\n')
    f.write('//  Бонусы: ! щит  & магнит  * звезда\n')
    f.write('const LEVELS = [\n')
    for lv in levels:
        f.write('  {\n')
        for k in ('name', 'name_en', 'tip', 'tip_en', 'par', 'theme', 'ice', 'lowGrav', 'dark', 'boss'):
            if k in lv:
                f.write(f'    {k}: {json.dumps(lv[k], ensure_ascii=False)},\n')
        f.write('    map: [\n')
        for r in lv['map']: f.write('      ' + json.dumps(r) + ',\n')
        f.write('    ],\n  },\n')
    f.write('];\n')
print(len(levels), 'levels')
