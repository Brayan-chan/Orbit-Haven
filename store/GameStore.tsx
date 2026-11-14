import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_LEVELS, LEVEL_MAP, WORLD_LEVELS } from '@/game/levels';
import {
  ABILITY_LIST, ACHIEVEMENTS, DAILY_POOL, DEFAULTS, GOAL_MAP, ITEM_MAP, LIFE_PRICES, Goal, SHIELD_START_PRICE, SPECIALS, UPGRADE_PRICES, WORLDS, Cat,
} from '@/game/catalog';
import type { AbilityId } from '@/game/types';
import type { SimOpts } from '@/game/engine';
import { configureAudio } from '@/lib/audio';

const KEY = 'orbit-haven/save/v1';
const BAK = 'orbit-haven/save/v1.bak';

export interface LevelRec { stars: number; best: number; bestTime: number; plays: number }
export interface Settings { music: boolean; sfx: boolean; haptics: boolean; musicVol: number; sfxVol: number; reducedFx: boolean }
export interface SaveData {
  coins: number;
  crystals: number;
  levels: Record<string, LevelRec>;
  owned: string[];
  equipped: Record<Cat, string>;
  upgrades: Record<string, number>;
  claimed: string[];
  worldRewards: number[];
  daily: { date: string; progress: Record<string, number>; claimed: string[] };
  stats: Record<string, number>;
  settings: Settings;
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
export const defaultSave = (): SaveData => ({
  coins: 100,
  crystals: 60,
  levels: {},
  owned: Object.values(DEFAULTS),
  equipped: { ...DEFAULTS },
  upgrades: {},
  claimed: [],
  worldRewards: [],
  daily: { date: today(), progress: {}, claimed: [] },
  stats: {},
  settings: { music: true, sfx: true, haptics: true, musicVol: 0.6, sfxVol: 0.8, reducedFx: false },
});

const n = (v: any, d: number, min = 0, max = 1e9) => (typeof v === 'number' && isFinite(v) ? Math.min(max, Math.max(min, v)) : d);

function sanitize(raw: any): SaveData {
  const d = defaultSave();
  if (!raw || typeof raw !== 'object') return d;
  d.coins = n(raw.coins, d.coins);
  d.crystals = n(raw.crystals, d.crystals);
  for (const id of Object.keys(raw.levels ?? {})) {
    const l = raw.levels[id];
    if (LEVEL_MAP[id] && l) d.levels[id] = { stars: n(l.stars, 0, 0, 3), best: n(l.best, 0), bestTime: n(l.bestTime, 0), plays: n(l.plays, 0) };
  }
  const owned = Array.isArray(raw.owned) ? raw.owned.filter((i: string) => ITEM_MAP[i]) : [];
  d.owned = Array.from(new Set([...d.owned, ...owned]));
  (Object.keys(DEFAULTS) as Cat[]).forEach((c) => {
    const e = raw.equipped?.[c];
    if (e && ITEM_MAP[e]?.cat === c && d.owned.includes(e)) d.equipped[c] = e;
  });
  for (const k of Object.keys(raw.upgrades ?? {})) d.upgrades[k] = n(raw.upgrades[k], 0, 0, 3);
  d.claimed = Array.isArray(raw.claimed) ? raw.claimed.filter((i: string) => GOAL_MAP[i]) : [];
  d.worldRewards = Array.isArray(raw.worldRewards) ? raw.worldRewards.filter((i: number) => i >= 1 && i <= 5) : [];
  if (raw.daily?.date) d.daily = { date: String(raw.daily.date), progress: { ...(raw.daily.progress ?? {}) }, claimed: Array.isArray(raw.daily.claimed) ? raw.daily.claimed : [] };
  for (const k of Object.keys(raw.stats ?? {})) d.stats[k] = n(raw.stats[k], 0);
  if (raw.settings) {
    const s = raw.settings;
    d.settings = { music: s.music !== false, sfx: s.sfx !== false, haptics: s.haptics !== false, musicVol: n(s.musicVol, 0.6, 0, 1), sfxVol: n(s.sfxVol, 0.8, 0, 1), reducedFx: !!s.reducedFx };
  }
  return d;
}
const hash = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h);
};
const encode = (d: SaveData) => {
  const body = JSON.stringify(d);
  return JSON.stringify({ v: 1, sum: hash(body), body });
};
const decode = (txt: string | null): SaveData | null => {
  try {
    if (!txt) return null;
    const o = JSON.parse(txt);
    if (hash(o.body) !== o.sum) return null;
    return sanitize(JSON.parse(o.body));
  } catch {
    return null;
  }
};

export const levelsDone = (s: SaveData) => Object.values(s.levels).filter((l) => l.stars > 0).length;
export const worldStars = (s: SaveData, w: number) => WORLD_LEVELS[w - 1].reduce((a, l) => a + (s.levels[l.id]?.stars ?? 0), 0);
export const worldDone = (s: SaveData, w: number) => WORLD_LEVELS[w - 1].every((l) => (s.levels[l.id]?.stars ?? 0) > 0);
export const isUnlocked = (s: SaveData, id: string) => {
  const i = ALL_LEVELS.findIndex((l) => l.id === id);
  return i === 0 || (i > 0 && (s.levels[ALL_LEVELS[i - 1].id]?.stars ?? 0) > 0);
};
export const abilityUnlocked = (s: SaveData, id: AbilityId) => levelsDone(s) >= ABILITY_LIST.find((a) => a.id === id)!.unlockAt;

export function metric(s: SaveData, m: string, daily = false): number {
  if (daily) return s.daily.progress[m] ?? 0;
  const lv = Object.values(s.levels);
  switch (m) {
    case 'levelsDone': return levelsDone(s);
    case 'stars': return lv.reduce((a, l) => a + l.stars, 0);
    case 'threeStars': return lv.filter((l) => l.stars >= 3).length;
    case 'worlds': return [1, 2, 3, 4, 5].filter((w) => worldDone(s, w)).length;
    case 'shopBuys': return s.owned.length - Object.keys(DEFAULTS).length;
  }
  const mm = m.match(/^w(\d)stars$/);
  if (mm) return worldStars(s, Number(mm[1]));
  return s.stats[m] ?? 0;
}

export function dailyGoals(s: SaveData): Goal[] {
  let seed = Array.from(s.daily.date).reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
  const pool = [...DAILY_POOL];
  const out: Goal[] = [];
  while (out.length < 3) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    out.push(pool.splice(seed % pool.length, 1)[0]);
  }
  return out;
}

export function buildSimOpts(s: SaveData): SimOpts {
  const abilities: SimOpts['abilities'] = {};
  for (const a of ABILITY_LIST) {
    if (!abilityUnlocked(s, a.id)) continue;
    const lv = s.upgrades[a.id] ?? 0;
    const power = a.id === 'boost' || a.id === 'jump';
    abilities[a.id] = { charges: 1 + (lv >= 2 ? 1 : 0), dur: power ? 1 + 0.2 * lv : a.baseDur * (1 + 0.25 * lv), cooldown: a.cooldown * (1 - 0.1 * lv) };
  }
  const ex = ITEM_MAP[s.equipped.explosion];
  const tp = ITEM_MAP[s.equipped.teleport];
  return {
    lives: 3 + (s.upgrades.lives ?? 0),
    startShield: (s.upgrades.startShield ?? 0) > 0,
    abilities,
    fx: {
      explosion: { colors: ex.colors, count: ex.count ?? 36, speed: ex.speed ?? 220, square: ex.square },
      teleport: { color: tp.colors[0], rings: tp.count ?? 2 },
      scale: s.settings.reducedFx ? 0.4 : 1,
    },
  };
}

export interface RunSummary { score: number; crystals: number; dark: number; secrets: number; nearMiss: number; distance: number; time: number; livesLost: number; abilities: number; stars: number; completed: boolean }
export interface RunRewards { coins: number; crystals: number; record: boolean; prevBest: number; prevStars: number; stars: number; worldBonus: { coins: number; crystals: number } | null; unlocked: string[] }

interface Ctx {
  save: SaveData;
  ready: boolean;
  endRun: (id: string, r: RunSummary) => RunRewards;
  buy: (id: string) => boolean;
  equip: (id: string) => void;
  buyUpgrade: (key: string) => boolean;
  claim: (g: Goal) => void;
  setSetting: (p: Partial<Settings>) => void;
  reset: () => void;
}
const GameCtx = createContext<Ctx>(null as any);
export const useGame = () => useContext(GameCtx);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [save, setSave] = useState<SaveData>(defaultSave());
  const [ready, setReady] = useState(false);
  const ref = useRef(save);
  const lastTxt = useRef<string | null>(null);

  const commit = useCallback((next: SaveData) => {
    ref.current = next;
    setSave(next);
    const txt = encode(next);
    const prev = lastTxt.current;
    lastTxt.current = txt;
    (async () => {
      try {
        if (prev) await AsyncStorage.setItem(BAK, prev);
        await AsyncStorage.setItem(KEY, txt);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      let d: SaveData | null = null;
      try {
        const main = await AsyncStorage.getItem(KEY);
        d = decode(main);
        if (d) lastTxt.current = main;
        else d = decode(await AsyncStorage.getItem(BAK));
      } catch {}
      d = d ?? defaultSave();
      if (d.daily.date !== today()) d.daily = { date: today(), progress: {}, claimed: [] };
      ref.current = d;
      setSave(d);
      configureAudio(d.settings);
      setReady(true);
    })();
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      save,
      ready,
      endRun: (id, r) => {
        const s: SaveData = JSON.parse(JSON.stringify(ref.current));
        if (s.daily.date !== today()) s.daily = { date: today(), progress: {}, claimed: [] };
        const prev = s.levels[id] ?? { stars: 0, best: 0, bestTime: 0, plays: 0 };
        const before = levelsDone(s);
        const prevStars = prev.stars;
        let coins = r.dark * 5 + r.secrets * 10;
        if (r.completed) coins += (prevStars === 0 ? 20 : 8) + Math.max(0, r.stars - prevStars) * 25;
        const record = r.score > prev.best;
        s.levels[id] = {
          stars: Math.max(prev.stars, r.completed ? r.stars : 0),
          best: Math.max(prev.best, r.score),
          bestTime: r.completed ? (prev.bestTime ? Math.min(prev.bestTime, r.time) : r.time) : prev.bestTime,
          plays: prev.plays + 1,
        };
        const add = (k: string, v: number) => {
          s.stats[k] = (s.stats[k] ?? 0) + v;
          s.daily.progress[k] = (s.daily.progress[k] ?? 0) + v;
        };
        add('crystals', r.crystals); add('dark', r.dark); add('secrets', r.secrets); add('nearMiss', r.nearMiss);
        add('distance', Math.round(r.distance)); add('abilities', r.abilities); add('deaths', r.livesLost); add('runs', 1);
        add('playTime', Math.round(r.time));
        if (r.completed) { add('completions', 1); add('starsGained', Math.max(0, r.stars - prevStars)); }
        s.stats.totalScore = (s.stats.totalScore ?? 0) + r.score;
        let bonus: RunRewards['worldBonus'] = null;
        const w = LEVEL_MAP[id].world;
        if (worldDone(s, w) && !s.worldRewards.includes(w)) {
          s.worldRewards.push(w);
          bonus = WORLDS[w - 1].reward;
          coins += bonus.coins;
          s.crystals += bonus.crystals;
        }
        s.coins += coins;
        s.crystals += r.crystals;
        const unlocked: string[] = [];
        const after = levelsDone(s);
        ABILITY_LIST.forEach((a) => { if (before < a.unlockAt && after >= a.unlockAt) unlocked.push(`Habilidad: ${a.name}`); });
        commit(s);
        return { coins, crystals: r.crystals + (bonus?.crystals ?? 0), record, prevBest: prev.best, prevStars, stars: r.stars, worldBonus: bonus, unlocked };
      },
      buy: (id) => {
        const it = ITEM_MAP[id];
        const s: SaveData = JSON.parse(JSON.stringify(ref.current));
        if (!it || s.owned.includes(id) || s.crystals < it.price) return false;
        s.crystals -= it.price;
        s.owned.push(id);
        s.equipped[it.cat] = id;
        commit(s);
        return true;
      },
      equip: (id) => {
        const it = ITEM_MAP[id];
        if (!it || !ref.current.owned.includes(id)) return;
        commit({ ...ref.current, equipped: { ...ref.current.equipped, [it.cat]: id } });
      },
      buyUpgrade: (key) => {
        const s: SaveData = JSON.parse(JSON.stringify(ref.current));
        const lv = s.upgrades[key] ?? 0;
        let price: number;
        if (key === 'lives') price = lv >= 2 ? -1 : LIFE_PRICES[lv];
        else if (key === 'startShield') price = lv >= 1 ? -1 : SHIELD_START_PRICE;
        else price = lv >= 3 ? -1 : UPGRADE_PRICES[lv];
        if (price < 0 || s.coins < price) return false;
        s.coins -= price;
        s.upgrades[key] = lv + 1;
        commit(s);
        return true;
      },
      claim: (g) => {
        const s: SaveData = JSON.parse(JSON.stringify(ref.current));
        const daily = g.kind === 'daily';
        const done = daily ? s.daily.claimed.includes(g.id) : s.claimed.includes(g.id);
        if (done || metric(s, g.metric, daily) < g.target) return;
        if (daily) s.daily.claimed.push(g.id);
        else s.claimed.push(g.id);
        s.coins += g.coins;
        s.crystals += g.crystals ?? 0;
        commit(s);
      },
      setSetting: (p) => {
        const s = { ...ref.current, settings: { ...ref.current.settings, ...p } };
        configureAudio(s.settings);
        commit(s);
      },
      reset: () => commit(defaultSave()),
    }),
    [save, ready, commit],
  );
  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export { ACHIEVEMENTS, SPECIALS };
