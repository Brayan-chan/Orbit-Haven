export type Blink = { period: number; on: number; offset?: number };

export type Motion =
  | { type: 'static' }
  // ping-pong suave desde la posición base hasta base + (dx, dy)
  | { type: 'linear'; dx: number; dy: number; period: number; phase?: number }
  // recorre base → base + (dx, dy) y vuelve a empezar (meteoritos rápidos)
  | { type: 'sweep'; dx: number; dy: number; period: number; phase?: number }
  // gira alrededor de (cx, cy); el radio sale de la posición base
  | { type: 'orbit'; cx: number; cy: number; speed: number; phase?: number }
  // persigue al jugador cuando entra en su rango
  | { type: 'chase'; speed: number; range: number };

export type WellKind = 'normal' | 'inverse' | 'hostile';

export interface WellSpec {
  x: number;
  y: number;
  mu: number;
  influence: number;
  core: number;
  kind: WellKind;
  motion?: Motion;
}

export interface RockSpec {
  x: number;
  y: number;
  r: number;
  motion?: Motion;
  blink?: Blink;
  hot?: boolean;
}

export interface BeamSpec {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  kind: 'laser' | 'barrier';
  pulse?: Blink;
  spin?: number;
  slide?: Motion;
}

export interface MineSpec {
  x: number;
  y: number;
  trigger: number;
  blast: number;
}

export interface PortalSpec {
  id: string;
  to: string;
  x: number;
  y: number;
}

export interface CrystalSpec {
  x: number;
  y: number;
  kind?: 'crystal' | 'dark' | 'secret';
}

export interface ZoneSpec {
  x: number;
  name: string;
}

export interface LevelSpec {
  id: string;
  world: number;
  index: number;
  name: string;
  subtitle: string;
  hint?: string;
  width: number;
  zones: ZoneSpec[];
  spawn: { x: number; y: number; vx: number; vy: number };
  wells: WellSpec[];
  rocks: RockSpec[];
  beams: BeamSpec[];
  mines: MineSpec[];
  portals: PortalSpec[];
  crystals: CrystalSpec[];
  exit: { x: number; y: number };
  minCrystals: number;
  par: number;
}

export type AbilityId = 'slow' | 'shield' | 'boost' | 'magnet' | 'jump';
