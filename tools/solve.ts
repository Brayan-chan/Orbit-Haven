// Bot de verificación: busca (beam search) una secuencia de impulsos que lleve a la salida.
// Uso: npx tsx tools/solve.ts [idNivel...]
import { ALL_LEVELS } from '../game/levels';
import { DT, cloneSim, createSim, stepSim } from '../game/engine';

const fx = { explosion: { colors: ['#fff'], count: 0, speed: 0 }, teleport: { color: '#fff', rings: 0 }, scale: 0 };
const ids = process.argv.slice(2);
const levels = ids.length ? ALL_LEVELS.filter((l) => ids.includes(l.id)) : ALL_LEVELS;
const WIDTH = Number(process.env.W || 160);

let lastWhy = '';
let lastPos = '';
function solve(level: (typeof ALL_LEVELS)[number]) {
  const lv = { ...level, minCrystals: 0 };
  const s0 = createSim(lv, { lives: 1, startShield: false, abilities: {}, fx });
  s0.invuln = 0;
  let beam = [{ s: s0, sc: 0 }];
  const maxDepth = Math.round((level.par * 3) / 0.1);
  for (let depth = 0; depth < maxDepth; depth++) {
    const next: { s: typeof s0; sc: number }[] = [];
    const seen = new Set<string>();
    for (const b of beam) {
      for (const a of [0, 1]) {
        const c = cloneSim(b.s);
        c.holding = !!a;
        for (let i = 0; i < 12; i++) {
          stepSim(c, DT);
          c.events.length = 0;
          c.floaters.length = 0;
          if (c.mode !== 'play') break;
        }
        if (c.mode === 'won') return { ok: true, t: c.t };
        if (c.mode !== 'play') {
          lastWhy = c.lastHit;
          lastPos = `${Math.round(c.p.x)},${Math.round(c.p.y)}`;
          continue;
        }
        const e = level.exit;
        const d = Math.hypot(c.p.x - e.x, c.p.y - e.y);
        const key = `${Math.round(c.p.x / 18)},${Math.round(c.p.y / 18)},${Math.round(c.p.vx / 45)},${Math.round(c.p.vy / 45)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const out = c.p.x < 0 || c.p.x > level.width || c.p.y < 0 || c.p.y > 500;
        next.push({ s: c, sc: -d - (out ? 500 : 0) + Math.random() * 60 });
      }
    }
    if (!next.length) return { ok: false, t: depth * 0.1, why: 'todos mueren a los ' + (depth * 0.1).toFixed(1) + 's: ' + lastWhy + ' en ' + lastPos };
    next.sort((x, y) => y.sc - x.sc);
    const top = Math.floor(WIDTH * 0.5);
    const rest = next.slice(top);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    beam = [...next.slice(0, top), ...rest.slice(0, WIDTH - top)];
  }
  return { ok: false, t: maxDepth * 0.1, why: 'tiempo' };
}

for (const l of levels) {
  const t0 = Date.now();
  const r = solve(l);
  console.log(l.id, l.name.padEnd(26), r.ok ? `OK  ${r.t.toFixed(1)}s` : `NO  (${(r as any).why})`, `[${((Date.now() - t0) / 1000).toFixed(1)}s calc]`);
}
