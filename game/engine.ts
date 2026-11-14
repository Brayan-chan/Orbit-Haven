import type {
  AbilityId,
  BeamSpec,
  Blink,
  CrystalSpec,
  LevelSpec,
  MineSpec,
  Motion,
  PortalSpec,
  RockSpec,
  WellKind,
  WellSpec,
} from './types';

/* ------------------------------------------------------------------ */
/*  Simulación orbital pura (sin dependencias de React ni del render)  */
/*  Paso fijo → estable con cualquier FPS.                             */
/* ------------------------------------------------------------------ */

export const DT = 1 / 120;
export const PR = 7; // radio de la partícula
export const EXIT_R = 34;
export const MAGNET_R = 230;
const MAXV = 440;
const THRUST = 330;
const SLOW_SCALE = 0.35;

export interface AbilityCfg {
  charges: number;
  dur: number;
  cooldown: number;
}

export interface FxCfg {
  explosion: { colors: string[]; count: number; speed: number; square?: boolean };
  teleport: { color: string; rings: number };
  scale: number;
}

export interface SimOpts {
  lives: number;
  startShield: boolean;
  abilities: Partial<Record<AbilityId, AbilityCfg>>;
  fx: FxCfg;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  square?: boolean;
}
export interface Floater {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}
export interface Ring {
  x: number;
  y: number;
  r: number;
  max: number;
  life: number;
  life0: number;
  color: string;
}

export type SimEvent = {
  type:
    | 'crystal'
    | 'dark'
    | 'secret'
    | 'hit'
    | 'shieldBreak'
    | 'nearmiss'
    | 'portal'
    | 'zone'
    | 'escape'
    | 'ability'
    | 'denied'
    | 'won'
    | 'dead'
    | 'locked'
    | 'mine'
    | 'respawn'
    | 'oob';
  text?: string;
  id?: AbilityId;
};

export interface RWell {
  s: WellSpec;
  x: number;
  y: number;
  mu: number;
  infl: number;
  core: number;
  kind: WellKind;
}
export interface RRock {
  s: RockSpec;
  x: number;
  y: number;
  r: number;
  on: boolean;
  alpha: number;
  nm: boolean;
  nmCd: number;
  rot: number;
  spin: number;
  shape: string;
  gone: boolean;
  chasing: boolean;
  hot: boolean;
}
export interface RBeam {
  s: BeamSpec;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  on: boolean;
  warn: boolean;
  nm: boolean;
  nmCd: number;
}
export interface RMine {
  s: MineSpec;
  x: number;
  y: number;
  armed: boolean;
  timer: number;
  gone: boolean;
}
export interface RPortal {
  s: PortalSpec;
  x: number;
  y: number;
}
export interface RCrystal {
  s: CrystalSpec;
  x: number;
  y: number;
  kind: 'crystal' | 'dark' | 'secret';
  taken: boolean;
}

export interface Sim {
  level: LevelSpec;
  opts: SimOpts;
  mode: 'play' | 'respawn' | 'dead' | 'won';
  t: number;
  clock: number;
  wt: number;
  timeScale: number;
  p: { x: number; y: number; vx: number; vy: number };
  holding: boolean;
  thrust: number;
  thrustDir: { x: number; y: number };
  center: RWell | null;
  lives: number;
  maxLives: number;
  livesLost: number;
  invuln: number;
  respawnT: number;
  shield: boolean;
  shieldT: number;
  slowT: number;
  magnetT: number;
  abil: Partial<Record<AbilityId, { charges: number; cd: number; cfg: AbilityCfg }>>;
  crystals: number;
  dark: number;
  secrets: number;
  nearMiss: number;
  nmScore: number;
  combo: number;
  distance: number;
  abilitiesUsed: number;
  wells: RWell[];
  rocks: RRock[];
  beams: RBeam[];
  mines: RMine[];
  portals: RPortal[];
  pickups: RCrystal[];
  trail: { x: number; y: number }[];
  trailAcc: number;
  partAcc: number;
  parts: Particle[];
  floaters: Floater[];
  rings: Ring[];
  events: SimEvent[];
  zoneIdx: number;
  checkpoint: { x: number; y: number; vx: number; vy: number };
  oobT: number;
  portalCd: number;
  exitMsgCd: number;
  wonT: number;
  lastHit: string;
  camX: number;
  stars: number;
  orbitTravel: number;
  lastOrbitAngle: number | null;
}

/* ------------------------------ utilidades ------------------------------ */

function mulberry(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const frac = (v: number) => v - Math.floor(v);

export function motionPos(bx: number, by: number, m: Motion | undefined, t: number): [number, number] {
  if (!m || m.type === 'static' || m.type === 'chase') return [bx, by];
  if (m.type === 'linear') {
    const k = 0.5 - 0.5 * Math.cos(2 * Math.PI * (t / m.period + (m.phase ?? 0)));
    return [bx + m.dx * k, by + m.dy * k];
  }
  if (m.type === 'sweep') {
    const k = frac(t / m.period + (m.phase ?? 0));
    return [bx + m.dx * k, by + m.dy * k];
  }
  const r = Math.hypot(bx - m.cx, by - m.cy);
  const a = Math.atan2(by - m.cy, bx - m.cx) + (m.phase ?? 0) + m.speed * t;
  return [m.cx + Math.cos(a) * r, m.cy + Math.sin(a) * r];
}

function blinkState(b: Blink | undefined, t: number) {
  if (!b) return { on: true, warn: false };
  const ph = (((t + (b.offset ?? 0)) % b.period) + b.period) % b.period;
  const on = ph < b.on;
  return { on, warn: !on && ph > b.period - 0.45 };
}

export function segDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function shapePoints(seed: number, r: number) {
  const rnd = mulberry(seed * 977 + Math.round(r));
  const pts: string[] = [];
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    const rr = r * (0.78 + rnd() * 0.3);
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`);
  }
  return pts.join(' ');
}

/* -------------------------------- creación -------------------------------- */

export function createSim(level: LevelSpec, opts: SimOpts): Sim {
  const sp = level.spawn;
  const abil: Sim['abil'] = {};
  (Object.keys(opts.abilities) as AbilityId[]).forEach((id) => {
    const cfg = opts.abilities[id]!;
    abil[id] = { charges: cfg.charges, cd: 0, cfg };
  });
  return {
    level,
    opts,
    mode: 'play',
    t: 0,
    clock: 0,
    wt: 0,
    timeScale: 1,
    p: { ...sp },
    holding: false,
    thrust: 0,
    thrustDir: { x: 1, y: 0 },
    center: null,
    lives: opts.lives,
    maxLives: opts.lives,
    livesLost: 0,
    invuln: 1.2,
    respawnT: 0,
    shield: opts.startShield,
    shieldT: opts.startShield ? 9999 : 0,
    slowT: 0,
    magnetT: 0,
    abil,
    crystals: 0,
    dark: 0,
    secrets: 0,
    nearMiss: 0,
    nmScore: 0,
    combo: 0,
    distance: 0,
    abilitiesUsed: 0,
    wells: level.wells.map((w) => ({ s: w, x: w.x, y: w.y, mu: w.mu, infl: w.influence, core: w.core, kind: w.kind })),
    rocks: level.rocks.map((r, i) => {
      const rnd = mulberry(i + 3);
      return {
        s: r,
        x: r.x,
        y: r.y,
        r: r.r,
        on: true,
        alpha: 1,
        nm: false,
        nmCd: 0,
        rot: rnd() * 360,
        spin: (rnd() - 0.5) * 50,
        shape: shapePoints(i + 1, r.r),
        gone: false,
        chasing: false,
        hot: !!r.hot,
      };
    }),
    beams: level.beams.map((b) => ({ s: b, x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2, on: true, warn: false, nm: false, nmCd: 0 })),
    mines: level.mines.map((m) => ({ s: m, x: m.x, y: m.y, armed: false, timer: 0, gone: false })),
    portals: level.portals.map((p) => ({ s: p, x: p.x, y: p.y })),
    pickups: level.crystals.map((c) => ({ s: c, x: c.x, y: c.y, kind: c.kind ?? 'crystal', taken: false })),
    trail: [],
    trailAcc: 0,
    partAcc: 0,
    parts: [],
    floaters: [],
    rings: [],
    events: [],
    zoneIdx: 0,
    checkpoint: { ...sp },
    oobT: 0,
    portalCd: 0,
    exitMsgCd: 0,
    wonT: 0,
    lastHit: '',
    camX: 0,
    stars: 0,
    orbitTravel: 0,
    lastOrbitAngle: null,
  };
}

/** Copia ligera para búsquedas (bot de pruebas). */
export function cloneSim(s: Sim): Sim {
  const abil: Sim['abil'] = {};
  (Object.keys(s.abil) as AbilityId[]).forEach((k) => (abil[k] = { ...s.abil[k]! }));
  return {
    ...s,
    p: { ...s.p },
    thrustDir: { ...s.thrustDir },
    checkpoint: { ...s.checkpoint },
    abil,
    wells: s.wells.map((x) => ({ ...x })),
    rocks: s.rocks.map((x) => ({ ...x })),
    beams: s.beams.map((x) => ({ ...x })),
    mines: s.mines.map((x) => ({ ...x })),
    portals: s.portals,
    pickups: s.pickups.map((x) => ({ ...x })),
    trail: [],
    parts: [],
    floaters: [],
    rings: [],
    events: [],
  };
}

/* ------------------------------ efectos visuales ------------------------------ */

function burst(s: Sim, x: number, y: number, colors: string[], count: number, speed: number, square = false) {
  const n = Math.round(count * s.opts.fx.scale);
  for (let i = 0; i < n; i++) {
    if (s.parts.length > 170) s.parts.shift();
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.25 + Math.random() * 0.75);
    const life = 0.5 + Math.random() * 0.7;
    s.parts.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life,
      max: life,
      color: colors[i % colors.length],
      size: 1.5 + Math.random() * 2.5,
      square,
    });
  }
}

function ring(s: Sim, x: number, y: number, color: string, max: number, life = 0.6) {
  if (s.rings.length > 12) s.rings.shift();
  s.rings.push({ x, y, r: 4, max, life, life0: life, color });
}

function floater(s: Sim, x: number, y: number, text: string, color: string) {
  if (s.floaters.length > 8) s.floaters.shift();
  s.floaters.push({ x, y: y - 14, text, life: 1.1, color });
}

function fx(s: Sim, dt: number) {
  for (let i = s.parts.length - 1; i >= 0; i--) {
    const q = s.parts[i];
    q.life -= dt;
    if (q.life <= 0) {
      s.parts.splice(i, 1);
      continue;
    }
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.vx *= 0.985;
    q.vy *= 0.985;
  }
  for (let i = s.floaters.length - 1; i >= 0; i--) {
    const f = s.floaters[i];
    f.life -= dt;
    f.y -= 26 * dt;
    if (f.life <= 0) s.floaters.splice(i, 1);
  }
  for (let i = s.rings.length - 1; i >= 0; i--) {
    const r = s.rings[i];
    r.life -= dt;
    r.r += (r.max / r.life0) * dt;
    if (r.life <= 0) s.rings.splice(i, 1);
  }
}

/* --------------------------------- daño --------------------------------- */

function hit(s: Sim, why: string) {
  if (s.invuln > 0 || s.mode !== 'play') return;
  const p = s.p;
  if (s.shield) {
    s.shield = false;
    s.shieldT = 0;
    s.invuln = 1.3;
    ring(s, p.x, p.y, '#35E0FF', 70, 0.5);
    burst(s, p.x, p.y, ['#35E0FF', '#FFFFFF'], 16, 160);
    s.events.push({ type: 'shieldBreak', text: why });
    return;
  }
  s.lives -= 1;
  s.livesLost += 1;
  s.combo = 0;
  s.lastHit = why;
  const e = s.opts.fx.explosion;
  burst(s, p.x, p.y, e.colors, e.count, e.speed, e.square);
  ring(s, p.x, p.y, e.colors[0], 90, 0.55);
  s.events.push({ type: 'hit', text: why });
  if (s.lives <= 0) {
    s.mode = 'dead';
    s.events.push({ type: 'dead', text: why });
  } else {
    s.mode = 'respawn';
    s.respawnT = 0.95;
  }
}

function award(s: Sim, o: { nm: boolean; nmCd: number }, d: number, hitD: number, dt: number) {
  o.nmCd = Math.max(0, o.nmCd - dt);
  const nearD = hitD + 20;
  if (d <= hitD) {
    o.nm = false;
    return;
  }
  if (d < nearD) {
    if (o.nmCd <= 0) o.nm = true;
  } else if (o.nm) {
    o.nm = false;
    o.nmCd = 2;
    const bonus = 50 + 25 * Math.min(s.combo, 6);
    s.combo += 1;
    s.nmScore += bonus;
    s.nearMiss += 1;
    floater(s, s.p.x, s.p.y, `+${bonus} RIESGO`, '#FFC83D');
    s.events.push({ type: 'nearmiss', text: `${bonus}` });
  }
}

/* --------------------------------- mundo --------------------------------- */

function updateWorld(s: Sim, wdt: number) {
  const t = s.wt;
  const p = s.p;
  for (const w of s.wells) {
    const [x, y] = motionPos(w.s.x, w.s.y, w.s.motion, t);
    w.x = x;
    w.y = y;
  }
  for (const r of s.rocks) {
    if (r.gone) continue;
    const b = blinkState(r.s.blink, t);
    r.on = b.on;
    r.alpha = b.on ? 1 : b.warn ? 0.45 : 0.1;
    const m = r.s.motion;
    if (m && m.type === 'chase') {
      const dx = p.x - r.x;
      const dy = p.y - r.y;
      const d = Math.hypot(dx, dy) || 1;
      if (s.mode === 'play' && (r.chasing || d < m.range)) {
        r.chasing = true;
        r.x += (dx / d) * m.speed * wdt;
        r.y += (dy / d) * m.speed * wdt;
      }
      for (const w of s.wells) {
        if (w.kind === 'inverse') continue;
        if (Math.hypot(w.x - r.x, w.y - r.y) < w.core + r.r * 0.6) {
          r.gone = true;
          burst(s, r.x, r.y, ['#FF8A2A', '#FFC83D', '#FFFFFF'], 22, 180);
          ring(s, r.x, r.y, '#FF8A2A', 60, 0.5);
        }
      }
    } else {
      const [x, y] = motionPos(r.s.x, r.s.y, m, t);
      r.x = x;
      r.y = y;
    }
    r.rot += r.spin * wdt;
  }
  for (const b of s.beams) {
    const sp = b.s;
    const [mx, my] = motionPos((sp.x1 + sp.x2) / 2, (sp.y1 + sp.y2) / 2, sp.slide, t);
    let hx = (sp.x2 - sp.x1) / 2;
    let hy = (sp.y2 - sp.y1) / 2;
    if (sp.spin) {
      const a = sp.spin * t;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      const nx = hx * c - hy * sn;
      hy = hx * sn + hy * c;
      hx = nx;
    }
    b.x1 = mx - hx;
    b.y1 = my - hy;
    b.x2 = mx + hx;
    b.y2 = my + hy;
    const st = blinkState(sp.pulse, t);
    b.on = st.on;
    b.warn = st.warn;
  }
  for (const m of s.mines) {
    if (m.gone || !m.armed) continue;
    m.timer -= wdt;
    if (m.timer <= 0) explodeMine(s, m);
  }
}

function explodeMine(s: Sim, m: RMine) {
  m.gone = true;
  burst(s, m.x, m.y, ['#FF3B5C', '#FF8A2A', '#FFC83D', '#FFFFFF'], 34, 240);
  ring(s, m.x, m.y, '#FF8A2A', m.s.blast, 0.45);
  s.events.push({ type: 'mine' });
  if (s.mode === 'play' && Math.hypot(s.p.x - m.x, s.p.y - m.y) < m.s.blast + PR * 0.6) hit(s, 'Explosión de mina espacial');
}

/* --------------------------------- jugador --------------------------------- */

function outDir(s: Sim) {
  const p = s.p;
  if (s.center) {
    const dx = p.x - s.center.x;
    const dy = p.y - s.center.y;
    const d = Math.hypot(dx, dy) || 1;
    return { x: dx / d, y: dy / d };
  }
  const v = Math.hypot(p.vx, p.vy) || 1;
  return { x: p.vx / v, y: p.vy / v };
}

function playerStep(s: Sim, dt: number) {
  const p = s.p;
  const lvl = s.level;
  const previousCenter = s.center;
  const control = lvl.control;
  let ax = 0;
  let ay = 0;
  let best: RWell | null = null;
  let bestA = 0;
  let nearest: RWell | null = null;
  let nearD = Infinity;

  for (const w of s.wells) {
    const dx = w.x - p.x;
    const dy = w.y - p.y;
    const d = Math.max(Math.hypot(dx, dy), 0.001);
    if (w.kind !== 'inverse' && d < nearD) {
      nearD = d;
      nearest = w;
    }
    if (d > w.infl) continue;
    let a = w.mu / Math.max(d * d, 900);
    const edge = w.infl * 0.65;
    if (d > edge) {
      const k = 1 - (d - edge) / (w.infl - edge);
      a *= k * k * (3 - 2 * k);
    }
    const sg = w.kind === 'inverse' ? -1 : 1;
    if (sg > 0 && s.holding) {
      const gravityScale = control?.gravityWhileThrust ?? 0.82;
      a *= 1 - s.thrust * (1 - gravityScale);
    }
    ax += (sg * a * dx) / d;
    ay += (sg * a * dy) / d;
    if (sg > 0 && a > bestA) {
      bestA = a;
      best = w;
    }
  }

  let scale = 1;
  let center = best;
  if (!center) {
    center = nearest;
    scale = 0.55;
  }
  s.center = best;

  if (best) {
    const angle = Math.atan2(p.y - best.y, p.x - best.x);
    if (s.lastOrbitAngle !== null) {
      let da = angle - s.lastOrbitAngle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      s.orbitTravel += Math.abs(da);
    }
    s.lastOrbitAngle = angle;
  } else s.lastOrbitAngle = null;

  if (previousCenter && !best && Math.hypot(p.vx, p.vy) > 120) {
    ring(s, p.x, p.y, '#35E0FF', 105, 0.7);
    burst(s, p.x, p.y, ['#35E0FF', '#FFFFFF', '#9B5CFF'], 18, 150);
    s.events.push({ type: 'escape' });
  }

  // impulso radial progresivo
  const target = s.holding ? 1 : 0;
  s.thrust += (target - s.thrust) * Math.min(1, dt * (target ? 7 : 11));
  let tx: number;
  let ty: number;
  if (center) {
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    const d = Math.hypot(dx, dy) || 1;
    tx = dx / d;
    ty = dy / d;
  } else {
    const v = Math.hypot(p.vx, p.vy) || 1;
    tx = p.vx / v;
    ty = p.vy / v;
    scale = 0.55;
  }
  s.thrustDir.x = tx;
  s.thrustDir.y = ty;
  const T = (control?.thrust ?? THRUST) * s.thrust * scale;
  ax += tx * T;
  ay += ty * T;
  if (center && s.thrust > 0.02) {
    let qx = -ty;
    let qy = tx;
    if (p.vx * qx + p.vy * qy < 0) {
      qx = -qx;
      qy = -qy;
    }
    const tangent = (control?.tangentThrust ?? 45) * s.thrust;
    ax += qx * tangent;
    ay += qy * tangent;
  }

  p.vx += ax * dt;
  p.vy += ay * dt;
  const sp = Math.hypot(p.vx, p.vy);
  if (sp > MAXV) {
    const f = 1 - (1 - MAXV / sp) * Math.min(1, dt * 3);
    p.vx *= f;
    p.vy *= f;
  }
  const ox = p.x;
  const oy = p.y;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  s.distance += Math.hypot(p.x - ox, p.y - oy);

  // estela
  s.trailAcc += dt;
  if (s.trailAcc >= 1 / 50) {
    s.trailAcc = 0;
    s.trail.push({ x: p.x, y: p.y });
    if (s.trail.length > 40) s.trail.shift();
  }
  // chispas de impulso
  if (s.thrust > 0.3) {
    s.partAcc += dt;
    if (s.partAcc > 0.03 / s.opts.fx.scale && s.parts.length < 150) {
      s.partAcc = 0;
      const life = 0.35;
      s.parts.push({
        x: p.x - tx * 5,
        y: p.y - ty * 5,
        vx: -tx * 60 + (Math.random() - 0.5) * 40 + p.vx * 0.3,
        vy: -ty * 60 + (Math.random() - 0.5) * 40 + p.vy * 0.3,
        life,
        max: life,
        color: '#FFFFFF',
        size: 1.6,
      });
    }
  }

  // zonas
  const zs = lvl.zones;
  if (s.zoneIdx + 1 < zs.length && p.x >= zs[s.zoneIdx + 1].x) {
    s.zoneIdx += 1;
    s.checkpoint = { x: p.x, y: p.y, vx: p.vx, vy: p.vy };
    s.events.push({ type: 'zone', text: zs[s.zoneIdx].name });
    ring(s, p.x, p.y, '#35E0FF', 80, 0.7);
  }

  // imanes
  for (const c of s.pickups) {
    if (c.taken) continue;
    let dx = p.x - c.x;
    let dy = p.y - c.y;
    let d = Math.hypot(dx, dy);
    if (s.magnetT > 0 && d < MAGNET_R && d > 1) {
      c.x += (dx / d) * 430 * dt;
      c.y += (dy / d) * 430 * dt;
      dx = p.x - c.x;
      dy = p.y - c.y;
      d = Math.hypot(dx, dy);
    }
    if (d < 15 + PR) {
      c.taken = true;
      if (c.kind === 'crystal') {
        s.crystals += 1;
        floater(s, c.x, c.y, '+1', '#35E0FF');
        s.events.push({ type: 'crystal' });
        burst(s, c.x, c.y, ['#35E0FF', '#FFFFFF'], 8, 90);
      } else if (c.kind === 'dark') {
        s.dark += 1;
        floater(s, c.x, c.y, '+5 MATERIA OSCURA', '#B26BFF');
        s.events.push({ type: 'dark' });
        burst(s, c.x, c.y, ['#B26BFF', '#FF8A2A'], 14, 120);
      } else {
        s.crystals += 1;
        s.secrets += 1;
        floater(s, c.x, c.y, 'RUTA SECRETA +500', '#FFC83D');
        s.events.push({ type: 'secret' });
        burst(s, c.x, c.y, ['#FFC83D', '#FFFFFF'], 18, 140);
        ring(s, c.x, c.y, '#FFC83D', 70, 0.6);
      }
    }
  }

  // portales
  if (s.portalCd > 0) s.portalCd -= dt;
  else {
    for (const pr of s.portals) {
      if (Math.hypot(p.x - pr.x, p.y - pr.y) < 20) {
        const dest = s.portals.find((q) => q.s.id === pr.s.to);
        if (!dest) continue;
        const f = s.opts.fx.teleport;
        for (let i = 0; i < f.rings; i++) {
          ring(s, pr.x, pr.y, f.color, 50 + i * 22, 0.5 + i * 0.1);
          ring(s, dest.x, dest.y, f.color, 50 + i * 22, 0.5 + i * 0.1);
        }
        burst(s, dest.x, dest.y, [f.color, '#FFFFFF'], 18, 140);
        p.x = dest.x;
        p.y = dest.y;
        s.trail = [];
        s.portalCd = 0.9;
        s.events.push({ type: 'portal' });
        break;
      }
    }
  }

  // salida
  if (s.exitMsgCd > 0) s.exitMsgCd -= dt;
  const ex = lvl.exit;
  const de = Math.hypot(p.x - ex.x, p.y - ex.y);
  if (de < EXIT_R) {
    const orbitReady = s.orbitTravel >= (lvl.minOrbits ?? 0) * Math.PI * 2;
    if (s.crystals >= lvl.minCrystals && orbitReady) {
      s.mode = 'won';
      s.wonT = 0;
      s.stars = rateStars(s);
      ring(s, ex.x, ex.y, '#35E0FF', 140, 0.9);
      ring(s, ex.x, ex.y, '#FFFFFF', 90, 0.7);
      burst(s, ex.x, ex.y, ['#35E0FF', '#FFFFFF', '#9B5CFF', '#FFC83D'], 50, 240);
      s.events.push({ type: 'won' });
      return;
    } else if (s.exitMsgCd <= 0) {
      s.exitMsgCd = 1.6;
      const text = !orbitReady ? 'CALIBRA LA ÓRBITA' : `FALTAN ${lvl.minCrystals - s.crystals} CRISTALES`;
      floater(s, ex.x, ex.y - 30, text, '#FF3B5C');
      s.events.push({ type: 'locked', text: !orbitReady ? 'orbit' : `${lvl.minCrystals - s.crystals}` });
    }
  }

  // colisiones: agujeros
  for (const w of s.wells) {
    if (w.kind === 'inverse') continue;
    if (Math.hypot(p.x - w.x, p.y - w.y) < w.core + PR * 0.4) {
      hit(s, 'Cayó en un agujero negro');
      return;
    }
  }
  // meteoritos
  for (const r of s.rocks) {
    if (r.gone || !r.on) continue;
    const d = Math.hypot(p.x - r.x, p.y - r.y);
    const hd = r.r + PR * 0.85;
    award(s, r, d, hd, dt);
    if (d < hd) {
      hit(s, 'Impacto con un meteorito');
      if (s.mode !== 'play') return;
    }
  }
  // láseres y barreras
  for (const b of s.beams) {
    if (!b.on) continue;
    const d = segDist(p.x, p.y, b.x1, b.y1, b.x2, b.y2);
    const hd = (b.s.kind === 'barrier' ? 7 : 3.5) + PR * 0.8;
    award(s, b, d, hd, dt);
    if (d < hd) {
      hit(s, b.s.kind === 'barrier' ? 'Barrera energética' : 'Láser activo');
      if (s.mode !== 'play') return;
    }
  }
  // minas
  for (const m of s.mines) {
    if (m.gone) continue;
    const d = Math.hypot(p.x - m.x, p.y - m.y);
    if (!m.armed && d < m.s.trigger) {
      m.armed = true;
      m.timer = 0.7;
    }
    if (d < 11 + PR * 0.6) {
      explodeMine(s, m);
      if (s.mode !== 'play') return;
    }
  }
  // límites del nivel (margen de cortesía)
  const out = p.x < -40 || p.x > lvl.width + 40 || p.y < -30 || p.y > 530;
  if (out) {
    s.oobT += dt;
    if (s.oobT > 1.2) {
      s.oobT = 0;
      hit(s, 'Salió de la zona de juego');
    }
  } else s.oobT = Math.max(0, s.oobT - dt * 2);
}

/* --------------------------------- paso --------------------------------- */

export function stepSim(s: Sim, dt: number) {
  s.clock += dt;
  if (s.mode === 'dead') {
    fx(s, dt);
    return;
  }
  if (s.mode === 'won') {
    s.wonT += dt;
    const e = s.level.exit;
    const k = Math.min(1, dt * 5);
    s.p.x += (e.x - s.p.x) * k;
    s.p.y += (e.y - s.p.y) * k;
    fx(s, dt * 0.35);
    return;
  }
  s.t += dt;
  s.invuln = Math.max(0, s.invuln - dt);
  if (s.slowT > 0) s.slowT -= dt;
  if (s.magnetT > 0) s.magnetT -= dt;
  if (s.shield && s.shieldT < 9000) {
    s.shieldT -= dt;
    if (s.shieldT <= 0) s.shield = false;
  }
  (Object.keys(s.abil) as AbilityId[]).forEach((k) => {
    const a = s.abil[k]!;
    if (a.cd > 0) a.cd = Math.max(0, a.cd - dt);
  });
  const target = s.slowT > 0 ? SLOW_SCALE : 1;
  s.timeScale += (target - s.timeScale) * Math.min(1, dt * 10);
  const wdt = dt * s.timeScale;
  s.wt += wdt;
  updateWorld(s, wdt);
  if (s.mode === 'respawn') {
    s.respawnT -= dt;
    if (s.respawnT <= 0) {
      s.p = { ...s.checkpoint };
      s.trail = [];
      s.thrust = 0;
      s.mode = 'play';
      s.invuln = 2.2;
      s.oobT = 0;
      ring(s, s.p.x, s.p.y, '#35E0FF', 70, 0.6);
      s.events.push({ type: 'respawn' });
    }
  } else {
    playerStep(s, dt);
  }
  fx(s, dt);
}

/* ------------------------------- habilidades ------------------------------- */

function isSafe(s: Sim, x: number, y: number, m: number) {
  if (x < 12 || x > s.level.width - 12 || y < 12 || y > 488) return false;
  for (const w of s.wells) if (w.kind !== 'inverse' && Math.hypot(x - w.x, y - w.y) < w.core + PR + m + 8) return false;
  for (const r of s.rocks) if (!r.gone && Math.hypot(x - r.x, y - r.y) < r.r + PR + m) return false;
  for (const b of s.beams) if (segDist(x, y, b.x1, b.y1, b.x2, b.y2) < 12 + m) return false;
  for (const mi of s.mines) if (!mi.gone && Math.hypot(x - mi.x, y - mi.y) < mi.s.blast * 0.7 + m) return false;
  for (const pr of s.portals) if (Math.hypot(x - pr.x, y - pr.y) < 30) return false;
  const e = s.level.exit;
  if (Math.hypot(x - e.x, y - e.y) < EXIT_R + 4) return false;
  return true;
}

export function activateAbility(s: Sim, id: AbilityId): boolean {
  const a = s.abil[id];
  if (!a || s.mode !== 'play' || a.charges <= 0 || a.cd > 0) return false;
  const p = s.p;
  const { cfg } = a;
  switch (id) {
    case 'slow':
      s.slowT = cfg.dur;
      ring(s, p.x, p.y, '#35E0FF', 110, 0.8);
      break;
    case 'shield':
      s.shield = true;
      s.shieldT = cfg.dur;
      ring(s, p.x, p.y, '#B26BFF', 60, 0.5);
      break;
    case 'boost': {
      const d = outDir(s);
      p.vx += d.x * 190 * cfg.dur;
      p.vy += d.y * 190 * cfg.dur;
      burst(s, p.x, p.y, ['#FFC83D', '#FFFFFF'], 16, 170);
      ring(s, p.x, p.y, '#FFC83D', 60, 0.4);
      break;
    }
    case 'magnet':
      s.magnetT = cfg.dur;
      ring(s, p.x, p.y, '#FF4F6D', MAGNET_R, 0.8);
      break;
    case 'jump': {
      const sp = Math.hypot(p.vx, p.vy);
      let dx: number;
      let dy: number;
      if (sp > 20) {
        dx = p.vx / sp;
        dy = p.vy / sp;
      } else {
        const o = outDir(s);
        dx = o.x;
        dy = o.y;
      }
      const maxD = 125 * cfg.dur;
      let found = false;
      for (let d = maxD; d >= 45; d -= 10) {
        const nx = p.x + dx * d;
        const ny = p.y + dy * d;
        if (isSafe(s, nx, ny, 10)) {
          const f = s.opts.fx.teleport;
          ring(s, p.x, p.y, f.color, 60, 0.45);
          burst(s, p.x, p.y, [f.color, '#FFFFFF'], 12, 120);
          p.x = nx;
          p.y = ny;
          s.trail = [];
          ring(s, nx, ny, f.color, 70, 0.55);
          burst(s, nx, ny, [f.color, '#FFFFFF'], 14, 130);
          found = true;
          break;
        }
      }
      if (!found) {
        s.events.push({ type: 'denied', text: 'Sin espacio seguro para saltar' });
        floater(s, p.x, p.y, 'SALTO BLOQUEADO', '#FF3B5C');
        return false;
      }
      break;
    }
  }
  a.charges -= 1;
  a.cd = cfg.cooldown;
  s.abilitiesUsed += 1;
  s.events.push({ type: 'ability', id });
  return true;
}

/* -------------------------- puntuación y estrellas -------------------------- */

export function computeScore(s: Sim) {
  const won = s.mode === 'won';
  const crystals = s.crystals * 100;
  const dark = s.dark * 200;
  const secrets = s.secrets * 500;
  const risk = s.nmScore;
  const dist = Math.floor(s.distance / 8);
  const time = won ? Math.max(0, Math.round((s.level.par - s.t) * 8)) : 0;
  const lives = won ? s.lives * 250 : 0;
  return { crystals, dark, secrets, risk, dist, time, lives, total: crystals + dark + secrets + risk + dist + time + lives };
}

export function rateStars(s: Sim) {
  const total = s.level.crystals.filter((c) => (c.kind ?? 'crystal') === 'crystal').length;
  const got = s.crystals - s.secrets;
  let st = 1;
  if (total === 0 || got >= Math.ceil(total * 0.75)) st = 2;
  if (st === 2 && (total === 0 || got >= total) && s.livesLost <= 1) st = 3;
  return st;
}

export function updateCamera(s: Sim, visW: number, dt: number, snap = false) {
  const w = s.level.width;
  let target: number;
  if (w <= visW) target = (w - visW) / 2;
  else {
    const speedLead = Math.max(-visW * 0.08, Math.min(visW * 0.12, s.p.vx * 0.16));
    target = Math.max(0, Math.min(w - visW, s.p.x - visW * 0.38 + speedLead));
  }
  if (snap) s.camX = target;
  else s.camX += (target - s.camX) * (1 - Math.exp(-6 * dt));
}
