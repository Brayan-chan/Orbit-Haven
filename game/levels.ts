import type { BeamSpec, Blink, CrystalSpec, LevelSpec, Motion, RockSpec, WellSpec } from './types';

/* ------------------------------------------------------------------ */
/*  Niveles definidos como datos: 25 niveles · 5 mundos.               */
/*  Todo parámetro (gravedad, patrones, pulsos) vive aquí, no en lógica */
/* ------------------------------------------------------------------ */

const w = (x: number, y: number, o: Partial<WellSpec> = {}): WellSpec => ({
  x,
  y,
  mu: 3.2e6,
  influence: 430,
  core: 22,
  kind: 'normal',
  ...o,
});

const orb = (c: WellSpec, deg: number, d: number, dir: 1 | -1 = 1, k = 1) => {
  const a = (deg * Math.PI) / 180;
  const v = Math.sqrt(c.mu / d) * k;
  return { x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d, vx: -Math.sin(a) * v * dir, vy: Math.cos(a) * v * dir };
};

const cry = (x: number, y: number, kind: CrystalSpec['kind'] = 'crystal'): CrystalSpec => ({ x, y, kind });
const row = (x1: number, y1: number, x2: number, y2: number, n: number, kind?: CrystalSpec['kind']) =>
  Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0 : i / (n - 1);
    return cry(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, kind);
  });
const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n: number, kind?: CrystalSpec['kind']) =>
  Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0 : i / (n - 1);
    const a = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
    return cry(cx + Math.cos(a) * r, cy + Math.sin(a) * r, kind);
  });

const rock = (x: number, y: number, r: number, motion?: Motion, extra: Partial<RockSpec> = {}): RockSpec => ({ x, y, r, motion, ...extra });
const hot = (x: number, y: number, r: number, motion?: Motion, extra: Partial<RockSpec> = {}): RockSpec => rock(x, y, r, motion, { hot: true, ...extra });
const laser = (x1: number, y1: number, x2: number, y2: number, pulse?: Blink, extra: Partial<BeamSpec> = {}): BeamSpec => ({
  x1,
  y1,
  x2,
  y2,
  kind: 'laser',
  pulse,
  ...extra,
});
const barrier = (x1: number, y1: number, x2: number, y2: number, extra: Partial<BeamSpec> = {}): BeamSpec => ({
  x1,
  y1,
  x2,
  y2,
  kind: 'barrier',
  ...extra,
});
const mine = (x: number, y: number) => ({ x, y, trigger: 85, blast: 62 });
const pair = (ax: number, ay: number, bx: number, by: number, key: string) => [
  { id: `${key}a`, to: `${key}b`, x: ax, y: ay },
  { id: `${key}b`, to: `${key}a`, x: bx, y: by },
];
const lin = (dx: number, dy: number, period: number, phase = 0): Motion => ({ type: 'linear', dx, dy, period, phase });
const sweep = (dx: number, dy: number, period: number, phase = 0): Motion => ({ type: 'sweep', dx, dy, period, phase });
const orbitM = (cx: number, cy: number, speed: number, phase = 0): Motion => ({ type: 'orbit', cx, cy, speed, phase });

type Base = Pick<LevelSpec, 'id' | 'world' | 'index' | 'name' | 'subtitle' | 'width' | 'spawn' | 'exit' | 'minCrystals' | 'par'>;
const L = (o: Base & Partial<LevelSpec>): LevelSpec => ({
  wells: [],
  rocks: [],
  beams: [],
  mines: [],
  portals: [],
  crystals: [],
  zones: [{ x: 0, name: 'Zona 1' }],
  ...o,
});

/* ============================ MUNDO 1 · NEBULOSA ============================ */
const A11 = w(300, 250);
const A12 = w(270, 300, { mu: 3.4e6 });
const A13 = w(250, 250);
const A14 = w(260, 250);
const A15 = w(480, 250, { mu: 4.6e6, core: 26, influence: 480 });

const W1: LevelSpec[] = [
  L({
    id: '1-1',
    world: 1,
    index: 0,
    name: 'Primer contacto',
    subtitle: 'Gravedad y órbitas',
    hint: 'Mantén presionado para alejarte del agujero negro. Suelta y la gravedad te atrae.',
    width: 1000,
    wells: [A11],
    spawn: orb(A11, 180, 110),
    exit: { x: 830, y: 230 },
    crystals: row(420, 150, 740, 205, 5),
    minCrystals: 0,
    par: 25,
  }),
  L({
    id: '1-2',
    world: 1,
    index: 1,
    name: 'Honda gravitacional',
    subtitle: 'Lanzamiento con la gravedad',
    hint: 'Suelta cuando apuntes al portal: la gravedad te lanza como una honda.',
    width: 1000,
    wells: [A12],
    rocks: [rock(560, 250, 28), rock(660, 150, 24), rock(540, 390, 24)],
    spawn: orb(A12, 90, 110),
    exit: { x: 880, y: 130 },
    crystals: [...arc(270, 300, 175, 205, 320, 4), ...row(620, 330, 800, 210, 3)],
    minCrystals: 3,
    par: 28,
  }),
  L({
    id: '1-3',
    world: 1,
    index: 2,
    name: 'Campo de rocas',
    subtitle: 'Esquiva meteoritos estáticos',
    hint: 'Algunos portales piden un mínimo de cristales. Recógelos al pasar.',
    width: 1000,
    wells: [A13],
    rocks: [rock(440, 170, 22), rock(470, 330, 26), rock(590, 250, 30), rock(700, 140, 24), rock(720, 370, 24), rock(790, 210, 20)],
    spawn: orb(A13, 200, 105, -1),
    exit: { x: 890, y: 270 },
    crystals: [cry(400, 250), cry(520, 150), cry(530, 350), cry(650, 320), cry(650, 180), cry(760, 290), cry(800, 120), cry(850, 380)],
    minCrystals: 4,
    par: 32,
  }),
  L({
    id: '1-4',
    world: 1,
    index: 3,
    name: 'Rocas errantes',
    subtitle: 'Meteoritos en movimiento',
    hint: 'Observa el patrón de los meteoritos antes de cruzar.',
    width: 1000,
    wells: [A14],
    rocks: [rock(560, 250, 24), rock(480, 100, 20, lin(0, 300, 4.2)), rock(650, 400, 22, lin(0, -300, 5, 0.25)), rock(780, 120, 20, lin(0, 260, 3.6, 0.5))],
    spawn: orb(A14, 180, 110),
    exit: { x: 910, y: 250 },
    crystals: [cry(420, 160), cry(420, 340), cry(560, 150), cry(560, 350), cry(700, 250), cry(700, 120), cry(840, 330), cry(850, 170)],
    minCrystals: 5,
    par: 34,
  }),
  L({
    id: '1-5',
    world: 1,
    index: 4,
    name: 'El ojo de la nebulosa',
    subtitle: 'Anillo de meteoritos orbitales',
    hint: 'Sal de la órbita cuando se abra un hueco en el anillo de rocas.',
    width: 1000,
    wells: [A15],
    rocks: [
      rock(670, 250, 24, orbitM(480, 250, 0.45)),
      rock(385, 415, 24, orbitM(480, 250, 0.45)),
      rock(385, 85, 24, orbitM(480, 250, 0.45)),
    ],
    spawn: orb(A15, 180, 115),
    exit: { x: 900, y: 160 },
    crystals: [...arc(480, 250, 150, 200, 340, 5), ...row(760, 300, 860, 220, 3)],
    minCrystals: 6,
    par: 38,
  }),
];

/* ======================== MUNDO 2 · SISTEMAS BINARIOS ======================= */
const A21 = w(260, 250, { mu: 3e6 });
const B21 = w(620, 250, { mu: 3e6 });
const A22 = w(430, 250, { mu: 1.8e6, motion: orbitM(520, 250, 0.35) });
const B22 = w(610, 250, { mu: 1.8e6, motion: orbitM(520, 250, 0.35) });
const A23 = w(260, 250);
const R23 = w(560, 250, { kind: 'inverse', mu: 2.2e6, influence: 200, core: 14 });
const A24 = w(230, 250);
const C24 = w(560, 250, { mu: 3.4e6, core: 20 });
const B24 = w(560, 130, { mu: 2.6e6, motion: orbitM(560, 250, 0.5) });
const T25a = w(260, 250, { mu: 2.6e6, motion: orbitM(340, 250, 0.7) });
const T25b = w(420, 250, { mu: 2.6e6, motion: orbitM(340, 250, 0.7) });
const R25 = w(800, 250, { kind: 'inverse', mu: 3e6, influence: 220, core: 14 });
const A25 = w(1060, 250, { mu: 3.6e6 });

const W2: LevelSpec[] = [
  L({
    id: '2-1',
    world: 2,
    index: 0,
    name: 'Dos soles',
    subtitle: 'Dos centros de gravedad',
    hint: 'Las gravedades se suman. Cambia de órbita en el momento justo.',
    width: 1000,
    wells: [A21, B21],
    spawn: orb(A21, 180, 105),
    exit: { x: 910, y: 250 },
    crystals: [...row(380, 120, 560, 105, 3), ...row(380, 395, 560, 405, 3), ...row(720, 160, 830, 210, 2)],
    minCrystals: 5,
    par: 34,
  }),
  L({
    id: '2-2',
    world: 2,
    index: 1,
    name: 'Danza binaria',
    subtitle: 'Agujeros negros que orbitan',
    hint: 'Los dos agujeros giran entre sí: su campo cambia sin parar.',
    width: 1000,
    wells: [A22, B22],
    spawn: { x: 250, y: 250, vx: 0, vy: -135 },
    exit: { x: 910, y: 110 },
    crystals: arc(520, 250, 215, 200, 560, 8),
    minCrystals: 5,
    par: 40,
  }),
  L({
    id: '2-3',
    world: 2,
    index: 2,
    name: 'Repulsor',
    subtitle: 'Zona de gravedad inversa',
    hint: 'La esfera cian repele: úsala para rebotar tu trayectoria.',
    width: 1000,
    wells: [A23, R23],
    rocks: [rock(740, 100, 24)],
    spawn: orb(A23, 180, 110),
    exit: { x: 910, y: 250 },
    crystals: [...arc(260, 250, 170, 210, 330, 3), ...row(450, 160, 540, 110, 2), ...row(450, 340, 540, 390, 2)],
    minCrystals: 4,
    par: 38,
  }),
  L({
    id: '2-4',
    world: 2,
    index: 3,
    name: 'Tres cuerpos',
    subtitle: 'Un agujero que orbita otro',
    hint: 'No hay órbitas estables: lee el movimiento de los tres cuerpos.',
    width: 1000,
    wells: [A24, C24, B24],
    rocks: [rock(830, 100, 22, lin(0, 300, 5))],
    spawn: orb(A24, 180, 105),
    exit: { x: 920, y: 390 },
    crystals: [...arc(560, 250, 150, 200, 340, 5), ...row(700, 330, 860, 250, 3), cry(820, 430, 'dark'), cry(560, 40, 'dark')],
    minCrystals: 7,
    par: 44,
  }),
  L({
    id: '2-5',
    world: 2,
    index: 4,
    name: 'Vals estelar',
    subtitle: 'Dos zonas conectadas',
    hint: 'Del baile binario a la zona de contracorriente. Conservas tu velocidad.',
    width: 1300,
    zones: [
      { x: 0, name: 'Danza binaria' },
      { x: 640, name: 'Contracorriente' },
    ],
    wells: [T25a, T25b, R25, A25],
    rocks: [rock(950, 110, 22, lin(0, 120, 3.4)), rock(950, 390, 22, lin(0, -120, 3.4, 0.5))],
    spawn: { x: 340, y: 90, vx: 180, vy: 0 },
    exit: { x: 1230, y: 250 },
    crystals: [...arc(340, 250, 160, 220, 330, 4), ...row(520, 130, 640, 110, 2), ...row(850, 150, 900, 350, 3), ...row(1120, 200, 1160, 320, 3), cry(800, 460, 'secret')],
    minCrystals: 8,
    par: 55,
  }),
];

/* ======================= MUNDO 3 · ESTACIÓN CUÁNTICA ======================== */
const A31 = w(250, 250);
const A32 = w(250, 250);
const A33 = w(240, 250);
const B33 = w(800, 340, { mu: 2.4e6, influence: 320 });
const A34 = w(240, 250);
const B34 = w(800, 250, { mu: 3.4e6 });
const A35 = w(240, 250);
const C35 = w(700, 250, { mu: 3.4e6, core: 20, influence: 340 });
const D35 = w(1150, 250, { mu: 3.2e6 });

const W3: LevelSpec[] = [
  L({
    id: '3-1',
    world: 3,
    index: 0,
    name: 'Primer láser',
    subtitle: 'Láser intermitente',
    hint: 'El láser parpadea antes de activarse. Cruza cuando esté apagado.',
    width: 1000,
    wells: [A31],
    beams: [laser(560, -10, 560, 510, { period: 3.2, on: 1.4 })],
    spawn: orb(A31, 180, 110),
    exit: { x: 870, y: 250 },
    crystals: [...row(380, 160, 500, 140, 3), ...row(640, 190, 780, 240, 3), cry(560, 250, 'dark')],
    minCrystals: 3,
    par: 34,
  }),
  L({
    id: '3-2',
    world: 3,
    index: 1,
    name: 'Barrera giratoria',
    subtitle: 'Obstáculo rotatorio',
    hint: 'Entra por el hueco que deja la barrera al girar.',
    width: 1000,
    wells: [A32],
    beams: [barrier(560, 80, 560, 420, { spin: 1.1 })],
    spawn: orb(A32, 180, 110),
    exit: { x: 890, y: 250 },
    crystals: [...row(380, 130, 460, 110, 2), ...row(380, 370, 460, 390, 2), ...row(680, 170, 820, 140, 2), ...row(680, 330, 820, 360, 2)],
    minCrystals: 4,
    par: 38,
  }),
  L({
    id: '3-3',
    world: 3,
    index: 2,
    name: 'Portales',
    subtitle: 'Teletransporte con inercia',
    hint: 'Los portales conservan tu velocidad. Atraviesa el muro por el portal.',
    width: 1000,
    wells: [A33, B33],
    beams: [laser(600, -10, 600, 510)],
    portals: pair(470, 400, 770, 110, 'p'),
    spawn: orb(A33, 180, 110),
    exit: { x: 920, y: 190 },
    crystals: [...row(320, 400, 430, 400, 2), ...row(660, 110, 700, 110, 2), ...row(840, 250, 880, 300, 2)],
    minCrystals: 3,
    par: 40,
  }),
  L({
    id: '3-4',
    world: 3,
    index: 3,
    name: 'Pasarela láser',
    subtitle: 'Compuertas alternas y barreras móviles',
    hint: 'Las compuertas alternan: cuando una se apaga, la otra se enciende.',
    width: 1250,
    zones: [
      { x: 0, name: 'Anillo de acceso' },
      { x: 620, name: 'Pasarela' },
    ],
    wells: [A34, B34],
    beams: [
      laser(500, -10, 500, 235, { period: 3, on: 1.3 }),
      laser(500, 265, 500, 510, { period: 3, on: 1.3, offset: 1.5 }),
      barrier(990, 170, 990, 330, { slide: lin(0, -120, 4) }),
      laser(1090, -10, 1090, 510, { period: 3.4, on: 1.2, offset: 1 }),
    ],
    spawn: orb(A34, 180, 110),
    exit: { x: 1180, y: 250 },
    crystals: [...row(340, 130, 440, 120, 2), ...row(580, 200, 700, 150, 2), ...row(880, 330, 960, 420, 2), ...row(1030, 80, 1060, 80, 2), cry(990, 470, 'secret'), cry(800, 90, 'dark')],
    minCrystals: 6,
    par: 55,
  }),
  L({
    id: '3-5',
    world: 3,
    index: 4,
    name: 'Sala de control',
    subtitle: 'Todas las trampas a la vez',
    hint: 'Hay un portal de atajo bajo la cámara giratoria. ¿Te atreves?',
    width: 1400,
    zones: [
      { x: 0, name: 'Núcleo' },
      { x: 480, name: 'Cámara giratoria' },
      { x: 1000, name: 'Salida' },
    ],
    wells: [A35, C35, D35],
    beams: [barrier(700, 80, 700, 420, { spin: 0.9 }), laser(1000, -10, 1000, 510, { period: 2.8, on: 1.1 })],
    rocks: [rock(1260, 120, 22, lin(0, 260, 4)), rock(1260, 380, 22, lin(0, -240, 3.4, 0.5))],
    portals: pair(440, 440, 880, 430, 'q'),
    spawn: orb(A35, 180, 110),
    exit: { x: 1340, y: 250 },
    crystals: [...row(340, 130, 440, 110, 2), ...arc(700, 250, 110, 200, 340, 3), ...row(930, 150, 960, 110, 2), ...row(1100, 330, 1180, 380, 2), cry(890, 470, 'secret'), cry(700, 250, 'dark')],
    minCrystals: 7,
    par: 70,
  }),
];

/* ======================= MUNDO 4 · HORIZONTE DE FUEGO ======================= */
const A41 = w(260, 250);
const A42 = w(260, 250);
const B42 = w(700, 390, { mu: 2.6e6, influence: 300 });
const A43 = w(300, 250, { mu: 5e6, core: 40, kind: 'hostile', influence: 400 });
const A44 = w(250, 250, { mu: 5.4e6, core: 34, kind: 'hostile', influence: 460 });
const B44 = w(780, 250, { mu: 5.4e6, core: 34, kind: 'hostile', influence: 460 });
const A45 = w(240, 250, { mu: 4.4e6, core: 28 });
const B45 = w(1260, 250, { mu: 5.2e6, core: 32, kind: 'hostile', influence: 440 });

const W4: LevelSpec[] = [
  L({
    id: '4-1',
    world: 4,
    index: 0,
    name: 'Lluvia ígnea',
    subtitle: 'Meteoritos rápidos',
    hint: 'Los meteoritos caen en columnas. Usa Dilatación temporal si la tienes.',
    width: 1000,
    wells: [A41],
    rocks: [
      hot(520, -30, 18, sweep(0, 560, 2.6, 0)),
      hot(605, -30, 18, sweep(0, 560, 2.6, 0.27)),
      hot(690, -30, 18, sweep(0, 560, 2.6, 0.54)),
      hot(775, -30, 18, sweep(0, 560, 2.6, 0.81)),
      hot(860, 530, 18, sweep(0, -560, 2.2, 0.3)),
    ],
    spawn: orb(A41, 180, 110),
    exit: { x: 930, y: 250 },
    crystals: [...row(400, 130, 470, 120, 2), ...row(400, 370, 470, 380, 2), cry(650, 250), cry(730, 250), cry(820, 250), cry(570, 250)],
    minCrystals: 4,
    par: 36,
  }),
  L({
    id: '4-2',
    world: 4,
    index: 1,
    name: 'Cazador',
    subtitle: 'Meteorito perseguidor',
    hint: 'El perseguidor te sigue. Atráelo hacia un agujero negro para destruirlo.',
    width: 1000,
    wells: [A42, B42],
    rocks: [hot(600, 250, 20, { type: 'chase', speed: 62, range: 330 }), rock(520, 120, 24), rock(520, 380, 24), rock(790, 250, 26)],
    spawn: orb(A42, 180, 110),
    exit: { x: 910, y: 120 },
    crystals: [...row(380, 150, 480, 250, 3), ...row(640, 170, 700, 270, 2), ...row(760, 410, 860, 300, 3)],
    minCrystals: 5,
    par: 40,
  }),
  L({
    id: '4-3',
    world: 4,
    index: 2,
    name: 'Campo minado',
    subtitle: 'Minas y gravedad extrema',
    hint: 'Las minas se activan al acercarte y explotan 0,7 s después. No te quedes.',
    width: 1000,
    wells: [A43],
    mines: [mine(480, 150), mine(520, 340), mine(610, 240), mine(680, 110), mine(690, 400), mine(770, 270), mine(810, 150)],
    spawn: orb(A43, 180, 150),
    exit: { x: 920, y: 250 },
    crystals: [...row(420, 250, 470, 250, 2), cry(560, 130), cry(600, 360), cry(740, 190), cry(850, 360), cry(480, 340, 'dark'), cry(610, 240, 'dark')],
    minCrystals: 5,
    par: 42,
  }),
  L({
    id: '4-4',
    world: 4,
    index: 3,
    name: 'Gravedad extrema',
    subtitle: 'Dos rutas: segura o arriesgada',
    hint: 'Ruta alta: rápida y con tesoro. Ruta baja: más larga pero tranquila.',
    width: 1250,
    zones: [
      { x: 0, name: 'Horno' },
      { x: 620, name: 'Bifurcación' },
    ],
    wells: [A44, B44],
    rocks: [hot(930, 250, 18, orbitM(780, 250, 0.8)), hot(630, 250, 18, orbitM(780, 250, 0.8)), hot(780, 100, 18, orbitM(780, 250, 0.8)), hot(780, 400, 18, orbitM(780, 250, 0.8))],
    mines: [mine(560, 90), mine(560, 410)],
    spawn: orb(A44, 180, 150),
    exit: { x: 1170, y: 250 },
    crystals: [...row(420, 150, 520, 200, 2), ...row(1000, 100, 1100, 180, 2), ...row(1000, 400, 1100, 330, 2), cry(780, 30, 'secret'), cry(780, 470, 'dark'), cry(930, 250, 'dark'), cry(700, 60), cry(700, 440)],
    minCrystals: 6,
    par: 55,
  }),
  L({
    id: '4-5',
    world: 4,
    index: 4,
    name: 'Corazón del volcán',
    subtitle: 'Tres zonas de fuego',
    hint: 'Cráter, lluvia de fuego y núcleo. Usa cada habilidad en su zona.',
    width: 1600,
    zones: [
      { x: 0, name: 'Cráter' },
      { x: 560, name: 'Lluvia de fuego' },
      { x: 1060, name: 'Núcleo' },
    ],
    wells: [A45, B45],
    rocks: [
      hot(660, -30, 18, sweep(0, 560, 2.4, 0)),
      hot(740, 530, 18, sweep(0, -560, 2.4, 0.4)),
      hot(820, -30, 18, sweep(0, 560, 2.4, 0.2)),
      hot(900, 530, 18, sweep(0, -560, 2.4, 0.7)),
      hot(1010, 110, 20, { type: 'chase', speed: 58, range: 320 }),
      hot(1410, 250, 18, orbitM(1260, 250, 0.75)),
      hot(1110, 250, 18, orbitM(1260, 250, 0.75)),
    ],
    mines: [mine(1000, 330), mine(1040, 170), mine(1180, 100), mine(1180, 400)],
    spawn: orb(A45, 180, 105),
    exit: { x: 1520, y: 250 },
    crystals: [...row(400, 140, 500, 110, 2), ...row(700, 250, 860, 250, 3), ...row(1080, 250, 1150, 250, 2), ...row(1400, 100, 1480, 140, 2), cry(1260, 450, 'dark'), cry(1260, 60, 'secret'), cry(900, 450), cry(660, 450)],
    minCrystals: 8,
    par: 78,
  }),
];

/* ===================== MUNDO 5 · DIMENSIÓN DESCONOCIDA ====================== */
const A51 = w(240, 250);
const C51 = w(900, 250, { mu: 2.6e6, influence: 300 });
const B51 = w(1500, 250, { mu: 4e6 });

const A52 = w(240, 250);
const B52 = w(760, 140, { mu: 3.2e6 });
const C52 = w(1240, 360, { mu: 3.4e6 });
const D52 = w(1700, 220, { mu: 4e6 });

const A53 = w(240, 250);
const R53 = w(700, 250, { kind: 'inverse', mu: 3.2e6, influence: 230, core: 14 });
const B53 = w(1000, 150, { mu: 3.4e6 });
const R53b = w(1400, 250, { kind: 'inverse', mu: 3.2e6, influence: 230, core: 14 });
const C53 = w(1700, 300, { mu: 3.6e6 });

const A54 = w(240, 250);
const B54 = w(900, 250, { mu: 3.4e6 });
const C54 = w(1500, 250, { mu: 3.4e6 });
const D54 = w(2000, 250, { mu: 3.6e6 });

const A55 = w(240, 250);
const H55 = w(800, 250, { mu: 5.2e6, core: 32, kind: 'hostile', influence: 440 });
const B55 = w(1330, 250, { mu: 3.2e6, motion: orbitM(1420, 250, 0.5) });
const B55b = w(1510, 250, { mu: 3.2e6, motion: orbitM(1420, 250, 0.5) });
const C55 = w(1900, 250, { mu: 4e6 });
const D55 = w(2330, 250, { mu: 3.6e6 });

const W5: LevelSpec[] = [
  L({
    id: '5-1',
    world: 5,
    index: 0,
    name: 'Umbral',
    subtitle: 'Cuatro zonas en una sola travesía',
    hint: 'Órbita, asteroides, compuertas y singularidad. Reúne 10 cristales.',
    width: 1800,
    zones: [
      { x: 0, name: 'Órbita inicial' },
      { x: 520, name: 'Campo de asteroides' },
      { x: 1040, name: 'Compuertas' },
      { x: 1420, name: 'Singularidad' },
    ],
    wells: [A51, C51, B51],
    rocks: [
      rock(600, 140, 24),
      rock(640, 360, 26),
      rock(720, 250, 22, lin(0, 200, 4)),
      rock(800, 90, 20, lin(0, 220, 3.6, 0.3)),
      rock(960, 400, 24),
      rock(1300, 130, 22, lin(0, 260, 3.8)),
    ],
    beams: [laser(1120, -10, 1120, 510, { period: 3, on: 1.2 }), laser(1230, -10, 1230, 510, { period: 3, on: 1.2, offset: 1.5 })],
    spawn: orb(A51, 180, 110),
    exit: { x: 1730, y: 250 },
    crystals: [...row(400, 140, 520, 120, 2), cry(680, 260), cry(700, 90), cry(740, 410), ...row(850, 160, 950, 230, 2), cry(1175, 250), ...row(1320, 340, 1400, 380, 2), ...arc(1500, 250, 130, 200, 340, 3), cry(1000, 40, 'secret'), cry(1500, 480, 'dark')],
    minCrystals: 10,
    par: 80,
  }),
  L({
    id: '5-2',
    world: 5,
    index: 1,
    name: 'Archipiélago',
    subtitle: 'Saltos entre sistemas',
    hint: 'Hay un portal de atajo que salta media travesía. Con riesgo.',
    width: 2000,
    zones: [
      { x: 0, name: 'Isla de salida' },
      { x: 560, name: 'Isla alta' },
      { x: 1040, name: 'Isla baja' },
      { x: 1500, name: 'Isla final' },
    ],
    wells: [A52, B52, C52, D52],
    rocks: [
      rock(480, 200, 22, lin(0, 160, 4)),
      rock(960, 250, 24, lin(0, 140, 3.2)),
      rock(1100, 120, 22),
      hot(1480, -30, 18, sweep(0, 560, 2.6)),
      hot(1560, 530, 18, sweep(0, -560, 2.6, 0.4)),
      rock(1860, 360, 24),
    ],
    mines: [mine(900, 420), mine(1380, 220)],
    portals: pair(690, 450, 1440, 90, 'r'),
    spawn: orb(A52, 180, 110),
    exit: { x: 1930, y: 250 },
    crystals: [...row(380, 120, 520, 70, 2), ...arc(760, 140, 140, 200, 340, 3), ...row(900, 300, 1100, 380, 3), ...arc(1240, 360, 130, 20, 160, 3), ...row(1600, 140, 1800, 200, 3), cry(1440, 40, 'secret'), cry(1700, 420, 'dark')],
    minCrystals: 9,
    par: 90,
  }),
  L({
    id: '5-3',
    world: 5,
    index: 2,
    name: 'Contracorriente',
    subtitle: 'Repulsores y asteroides fantasma',
    hint: 'Los asteroides fantasma aparecen y desaparecen. Usa los repulsores.',
    width: 2100,
    zones: [
      { x: 0, name: 'Origen' },
      { x: 520, name: 'Primer repulsor' },
      { x: 1100, name: 'Zona fantasma' },
      { x: 1560, name: 'Segundo repulsor' },
    ],
    wells: [A53, R53, B53, R53b, C53],
    rocks: [
      rock(560, 120, 24, undefined, { blink: { period: 3, on: 1.6 } }),
      rock(840, 350, 26, undefined, { blink: { period: 3, on: 1.6, offset: 1.5 } }),
      rock(1160, 250, 26, undefined, { blink: { period: 2.8, on: 1.4 } }),
      rock(1240, 100, 22, undefined, { blink: { period: 2.8, on: 1.4, offset: 1.4 } }),
      rock(1240, 400, 22, undefined, { blink: { period: 2.8, on: 1.4, offset: 1.4 } }),
      rock(1600, 140, 22, lin(0, 220, 4)),
      rock(1600, 400, 22, lin(0, -220, 4, 0.5)),
    ],
    beams: [barrier(1860, 130, 1860, 370, { slide: lin(0, 90, 3.6) })],
    spawn: orb(A53, 180, 110),
    exit: { x: 2030, y: 250 },
    crystals: [...row(380, 130, 480, 100, 2), ...row(600, 400, 800, 440, 3), ...arc(1000, 150, 130, 200, 340, 3), ...row(1300, 330, 1380, 120, 3), ...row(1700, 200, 1800, 300, 3), cry(1400, 470, 'dark'), cry(700, 40, 'secret')],
    minCrystals: 9,
    par: 95,
  }),
  L({
    id: '5-4',
    world: 5,
    index: 3,
    name: 'Laberinto cuántico',
    subtitle: 'Láseres, portales y barreras',
    hint: 'Los láseres siguen un ritmo: aprende el compás y atraviesa.',
    width: 2300,
    zones: [
      { x: 0, name: 'Acceso' },
      { x: 560, name: 'Compuertas dobles' },
      { x: 1150, name: 'Laberinto giratorio' },
      { x: 1780, name: 'Núcleo cuántico' },
    ],
    wells: [A54, B54, C54, D54],
    beams: [
      laser(660, -10, 660, 510, { period: 3, on: 1.2 }),
      laser(760, -10, 760, 510, { period: 3, on: 1.2, offset: 1.5 }),
      barrier(1250, 100, 1250, 400, { spin: 1 }),
      barrier(1750, 120, 1750, 380, { spin: -0.9 }),
      laser(1960, -10, 1960, 510, { period: 2.6, on: 1.1 }),
    ],
    rocks: [rock(1000, 140, 22, lin(0, 220, 3.8)), rock(1100, 370, 22, lin(0, -200, 3.4, 0.4)), hot(2100, 150, 20, { type: 'chase', speed: 58, range: 320 })],
    portals: pair(450, 430, 1050, 430, 's'),
    spawn: orb(A54, 180, 110),
    exit: { x: 2230, y: 250 },
    crystals: [...row(380, 130, 520, 110, 2), cry(710, 250), ...arc(900, 250, 130, 200, 340, 3), ...row(1100, 120, 1180, 100, 2), ...arc(1500, 250, 130, 200, 340, 3), ...row(1850, 100, 1900, 120, 2), cry(2100, 380), cry(1050, 480, 'secret'), cry(1250, 250, 'dark')],
    minCrystals: 10,
    par: 105,
  }),
  L({
    id: '5-5',
    world: 5,
    index: 4,
    name: 'Más allá del horizonte',
    subtitle: 'El recorrido definitivo',
    hint: 'Todo lo aprendido, en un solo viaje. Planifica tus habilidades.',
    width: 2600,
    zones: [
      { x: 0, name: 'Partida' },
      { x: 560, name: 'Horno hostil' },
      { x: 1100, name: 'Binario perdido' },
      { x: 1700, name: 'Compuertas finales' },
      { x: 2150, name: 'Horizonte' },
    ],
    wells: [A55, H55, B55, B55b, C55, D55],
    rocks: [
      hot(930, 250, 18, orbitM(800, 250, 0.8)),
      hot(670, 250, 18, orbitM(800, 250, 0.8)),
      rock(1180, 90, 22, lin(0, 140, 3.2)),
      rock(1180, 420, 22, lin(0, -140, 3.2, 0.4)),
      hot(1620, 120, 20, { type: 'chase', speed: 58, range: 330 }),
      rock(1860, 150, 22, undefined, { blink: { period: 2.6, on: 1.3 } }),
      rock(1860, 350, 22, undefined, { blink: { period: 2.6, on: 1.3, offset: 1.3 } }),
      hot(2250, -30, 18, sweep(0, 560, 2.4)),
      hot(2330, 530, 18, sweep(0, -560, 2.4, 0.5)),
    ],
    beams: [
      laser(1980, -10, 1980, 510, { period: 2.6, on: 1.1 }),
      barrier(1800, 150, 1800, 350, { slide: lin(0, 80, 3.4) }),
      laser(2060, -10, 2060, 510, { period: 2.6, on: 1.1, offset: 1.3 }),
    ],
    mines: [mine(560, 90), mine(560, 410), mine(1030, 180), mine(1030, 330)],
    portals: pair(1080, 450, 1620, 440, 't'),
    spawn: orb(A55, 180, 110),
    exit: { x: 2530, y: 250 },
    crystals: [
      ...row(400, 140, 520, 110, 2),
      cry(800, 70),
      cry(800, 440),
      ...arc(1420, 250, 160, 200, 340, 3),
      ...row(1750, 90, 1900, 100, 2),
      ...row(2180, 130, 2420, 130, 3),
      cry(2180, 400),
      cry(1330, 470, 'secret'),
      cry(800, 250, 'dark'),
      cry(2300, 250, 'dark'),
    ],
    minCrystals: 11,
    par: 125,
  }),
];

export const WORLD_LEVELS: LevelSpec[][] = [W1, W2, W3, W4, W5];
export const ALL_LEVELS: LevelSpec[] = [...W1, ...W2, ...W3, ...W4, ...W5];
export const LEVEL_MAP: Record<string, LevelSpec> = Object.fromEntries(ALL_LEVELS.map((l) => [l.id, l]));
export const getLevel = (id: string | undefined) => (id ? LEVEL_MAP[id] : undefined);
export const nextLevelId = (id: string) => {
  const i = ALL_LEVELS.findIndex((l) => l.id === id);
  return i >= 0 && i < ALL_LEVELS.length - 1 ? ALL_LEVELS[i + 1].id : null;
};
