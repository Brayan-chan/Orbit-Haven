import type { AbilityId } from './types';

export type Palette = { bg: [string, string]; nebula: [string, string, string]; accent: string };

export const WORLDS: { id: number; name: string; tag: string; desc: string; pal: Palette; reward: { coins: number; crystals: number }; root: number }[] = [
  { id: 1, name: 'Nebulosa', tag: 'Principiante', desc: 'Gravedad, órbitas, cristales y meteoritos sencillos.', pal: { bg: ['#0B0626', '#1B0C52'], nebula: ['#7B2CFF', '#2B6BFF', '#35E0FF'], accent: '#35E0FF' }, reward: { coins: 150, crystals: 20 }, root: 110 },
  { id: 2, name: 'Sistemas binarios', tag: 'Intermedio', desc: 'Varios centros de gravedad, órbitas cambiantes y repulsores.', pal: { bg: ['#07102A', '#10205A'], nebula: ['#3D5BFF', '#FF7A3D', '#9B5CFF'], accent: '#5AA7FF' }, reward: { coins: 220, crystals: 30 }, root: 98 },
  { id: 3, name: 'Estación cuántica', tag: 'Avanzado', desc: 'Láseres, barreras giratorias, portales y trampas.', pal: { bg: ['#050B1A', '#0B2133'], nebula: ['#00E5C8', '#2B6BFF', '#FF3BD8'], accent: '#00E5C8' }, reward: { coins: 300, crystals: 40 }, root: 123 },
  { id: 4, name: 'Horizonte de fuego', tag: 'Experto', desc: 'Meteoritos rápidos, minas, perseguidores y gravedad extrema.', pal: { bg: ['#14040A', '#33090F'], nebula: ['#FF4B1F', '#FF9A2A', '#B01E5B'], accent: '#FF8A2A' }, reward: { coins: 400, crystals: 55 }, root: 87 },
  { id: 5, name: 'Dimensión desconocida', tag: 'Extremo', desc: 'Recorridos largos de varias zonas con todo combinado.', pal: { bg: ['#04040C', '#150B34'], nebula: ['#FF4FD8', '#35FFB0', '#7B2CFF'], accent: '#C98BFF' }, reward: { coins: 600, crystals: 80 }, root: 104 },
];

export type AbilityDef = { id: AbilityId; name: string; desc: string; color: string; unlockAt: number; baseDur: number; cooldown: number; icon: string; stat: string };
export const ABILITY_LIST: AbilityDef[] = [
  { id: 'shield', name: 'Escudo de plasma', desc: 'Absorbe un impacto.', color: '#B26BFF', unlockAt: 1, baseDur: 12, cooldown: 6, icon: 'Shield', stat: 'Duración' },
  { id: 'slow', name: 'Dilatación temporal', desc: 'Ralentiza obstáculos y entorno.', color: '#35E0FF', unlockAt: 3, baseDur: 3.5, cooldown: 9, icon: 'Hourglass', stat: 'Duración' },
  { id: 'magnet', name: 'Atracción magnética', desc: 'Atrae los cristales cercanos.', color: '#FF4F6D', unlockAt: 5, baseDur: 5, cooldown: 8, icon: 'Magnet', stat: 'Duración' },
  { id: 'boost', name: 'Impulso energético', desc: 'Empuje extra hacia afuera.', color: '#FFC83D', unlockAt: 7, baseDur: 1, cooldown: 5, icon: 'Zap', stat: 'Potencia' },
  { id: 'jump', name: 'Salto cuántico', desc: 'Salto corto y seguro.', color: '#3CFFA0', unlockAt: 10, baseDur: 1, cooldown: 6, icon: 'ChevronsRight', stat: 'Alcance' },
];
export const ABILITY_MAP = Object.fromEntries(ABILITY_LIST.map((a) => [a.id, a])) as Record<AbilityId, AbilityDef>;

export type Cat = 'particle' | 'trail' | 'explosion' | 'teleport' | 'shield' | 'theme';
export type Item = { id: string; cat: Cat; name: string; price: number; colors: string[]; shape?: string; count?: number; speed?: number; square?: boolean; pal?: Palette };

export const CAT_LABEL: Record<Cat, string> = { particle: 'Partículas', trail: 'Estelas', explosion: 'Explosiones', teleport: 'Teletransporte', shield: 'Escudos', theme: 'Temas' };
export const CATS = Object.keys(CAT_LABEL) as Cat[];
export const DEFAULTS: Record<Cat, string> = { particle: 'p-plasma', trail: 't-ion', explosion: 'x-nova', teleport: 'w-ring', shield: 's-plasma', theme: 'th-nebula' };

export const ITEMS: Item[] = [
  { id: 'p-plasma', cat: 'particle', name: 'Plasma azul', price: 0, colors: ['#FFFFFF', '#35E0FF'], shape: 'orb' },
  { id: 'p-ember', cat: 'particle', name: 'Brasa solar', price: 120, colors: ['#FFF3D0', '#FF8A2A'], shape: 'orb' },
  { id: 'p-amethyst', cat: 'particle', name: 'Amatista', price: 180, colors: ['#F4E6FF', '#B26BFF'], shape: 'diamond' },
  { id: 'p-halo', cat: 'particle', name: 'Halo esmeralda', price: 260, colors: ['#FFFFFF', '#3CFFA0'], shape: 'ring' },
  { id: 'p-nova', cat: 'particle', name: 'Estrella nova', price: 400, colors: ['#FFFFFF', '#FFC83D'], shape: 'diamond' },
  { id: 't-ion', cat: 'trail', name: 'Ion', price: 0, colors: ['#3D7BFF', '#35E0FF'] },
  { id: 't-fire', cat: 'trail', name: 'Cometa de fuego', price: 100, colors: ['#FF3B5C', '#FF8A2A', '#FFC83D'] },
  { id: 't-violet', cat: 'trail', name: 'Violeta', price: 150, colors: ['#6D2BFF', '#FF4FD8'] },
  { id: 't-aurora', cat: 'trail', name: 'Aurora', price: 220, colors: ['#9B5CFF', '#35E0FF', '#3CFFA0'] },
  { id: 't-crystal', cat: 'trail', name: 'Cristal', price: 320, colors: ['#9BE8FF', '#FFFFFF'] },
  { id: 'x-nova', cat: 'explosion', name: 'Nova', price: 0, colors: ['#FFFFFF', '#35E0FF', '#9B5CFF'], count: 36, speed: 220 },
  { id: 'x-sun', cat: 'explosion', name: 'Supernova', price: 140, colors: ['#FFC83D', '#FF8A2A', '#FF3B5C'], count: 48, speed: 260 },
  { id: 'x-glitch', cat: 'explosion', name: 'Glitch', price: 200, colors: ['#3CFFA0', '#FF4FD8', '#FFFFFF'], count: 40, speed: 230, square: true },
  { id: 'x-star', cat: 'explosion', name: 'Lluvia estelar', price: 300, colors: ['#FFFFFF', '#FFC83D'], count: 60, speed: 300 },
  { id: 'w-ring', cat: 'teleport', name: 'Anillos cian', price: 0, colors: ['#35E0FF'], count: 2 },
  { id: 'w-violet', cat: 'teleport', name: 'Destello violeta', price: 120, colors: ['#B26BFF'], count: 3 },
  { id: 'w-gold', cat: 'teleport', name: 'Pulso dorado', price: 220, colors: ['#FFC83D'], count: 4 },
  { id: 's-plasma', cat: 'shield', name: 'Plasma', price: 0, colors: ['#35E0FF'] },
  { id: 's-hex', cat: 'shield', name: 'Violeta', price: 140, colors: ['#B26BFF'] },
  { id: 's-solar', cat: 'shield', name: 'Solar', price: 220, colors: ['#FFB02E'] },
  { id: 'th-nebula', cat: 'theme', name: 'Nebulosa clásica', price: 0, colors: ['#7B2CFF', '#35E0FF'] },
  { id: 'th-aurora', cat: 'theme', name: 'Aurora boreal', price: 180, colors: ['#00E5B0', '#2B6BFF'], pal: { bg: ['#031418', '#06283A'], nebula: ['#00E5B0', '#2B6BFF', '#35E0FF'], accent: '#3CFFA0' } },
  { id: 'th-crimson', cat: 'theme', name: 'Carmesí', price: 220, colors: ['#FF3B5C', '#9B1DFF'], pal: { bg: ['#12030D', '#2A0A24'], nebula: ['#FF3B5C', '#9B1DFF', '#FF8A2A'], accent: '#FF6B8A' } },
  { id: 'th-mono', cat: 'theme', name: 'Medianoche', price: 160, colors: ['#6A7BA8', '#FFFFFF'], pal: { bg: ['#05070D', '#10162A'], nebula: ['#4A5C8C', '#35E0FF', '#9BB0E0'], accent: '#9BE8FF' } },
];
export const ITEM_MAP = Object.fromEntries(ITEMS.map((i) => [i.id, i])) as Record<string, Item>;

export const UPGRADE_PRICES = [120, 260, 480];
export const LIFE_PRICES = [400, 900];
export const SHIELD_START_PRICE = 700;

export type Goal = { id: string; kind: 'daily' | 'achievement' | 'special'; title: string; desc: string; metric: string; target: number; coins: number; crystals?: number };
export const DAILY_POOL: Goal[] = [
  { id: 'd-crystals', kind: 'daily', title: 'Recolector', desc: 'Recoge 30 cristales', metric: 'crystals', target: 30, coins: 40 },
  { id: 'd-levels', kind: 'daily', title: 'Constancia', desc: 'Completa 3 niveles', metric: 'completions', target: 3, coins: 50 },
  { id: 'd-near', kind: 'daily', title: 'Al límite', desc: 'Esquiva 12 obstáculos rozándolos', metric: 'nearMiss', target: 12, coins: 45 },
  { id: 'd-abil', kind: 'daily', title: 'Poder en acción', desc: 'Usa 4 habilidades', metric: 'abilities', target: 4, coins: 35 },
  { id: 'd-dark', kind: 'daily', title: 'Materia oscura', desc: 'Recoge 3 fragmentos de materia oscura', metric: 'dark', target: 3, coins: 60 },
  { id: 'd-dist', kind: 'daily', title: 'Viajero', desc: 'Recorre 6000 unidades', metric: 'distance', target: 6000, coins: 40 },
  { id: 'd-stars', kind: 'daily', title: 'Estrella fugaz', desc: 'Gana 3 estrellas nuevas', metric: 'starsGained', target: 3, coins: 60 },
  { id: 'd-runs', kind: 'daily', title: 'Piloto incansable', desc: 'Juega 6 partidas', metric: 'runs', target: 6, coins: 30 },
];
export const ACHIEVEMENTS: Goal[] = [
  { id: 'a-first', kind: 'achievement', title: 'Primera órbita', desc: 'Completa tu primer nivel', metric: 'levelsDone', target: 1, coins: 30 },
  { id: 'a-cry1', kind: 'achievement', title: 'Cazador de cristales', desc: 'Recoge 100 cristales', metric: 'crystals', target: 100, coins: 50 },
  { id: 'a-cry2', kind: 'achievement', title: 'Minero estelar', desc: 'Recoge 500 cristales', metric: 'crystals', target: 500, coins: 150 },
  { id: 'a-stars1', kind: 'achievement', title: 'Constelación', desc: 'Consigue 15 estrellas', metric: 'stars', target: 15, coins: 80 },
  { id: 'a-stars2', kind: 'achievement', title: 'Galaxia', desc: 'Consigue 40 estrellas', metric: 'stars', target: 40, coins: 200, crystals: 20 },
  { id: 'a-three', kind: 'achievement', title: 'Perfeccionista', desc: '3 estrellas en 5 niveles', metric: 'threeStars', target: 5, coins: 120 },
  { id: 'a-w1', kind: 'achievement', title: 'Explorador', desc: 'Completa un mundo', metric: 'worlds', target: 1, coins: 100 },
  { id: 'a-w5', kind: 'achievement', title: 'Más allá del horizonte', desc: 'Completa los 5 mundos', metric: 'worlds', target: 5, coins: 500, crystals: 50 },
  { id: 'a-near1', kind: 'achievement', title: 'Al límite', desc: '25 rozones', metric: 'nearMiss', target: 25, coins: 60 },
  { id: 'a-near2', kind: 'achievement', title: 'Sangre fría', desc: '100 rozones', metric: 'nearMiss', target: 100, coins: 150 },
  { id: 'a-dark', kind: 'achievement', title: 'Materia oscura', desc: 'Recoge 10 fragmentos', metric: 'dark', target: 10, coins: 90 },
  { id: 'a-secret', kind: 'achievement', title: 'Descubridor', desc: 'Encuentra 3 rutas secretas', metric: 'secrets', target: 3, coins: 120 },
  { id: 'a-abil', kind: 'achievement', title: 'Maestro de poderes', desc: 'Usa 20 habilidades', metric: 'abilities', target: 20, coins: 80 },
  { id: 'a-shop', kind: 'achievement', title: 'Coleccionista', desc: 'Compra 3 cosméticos', metric: 'shopBuys', target: 3, coins: 60 },
  { id: 'a-dist', kind: 'achievement', title: 'Viajero', desc: 'Recorre 50 000 unidades', metric: 'distance', target: 50000, coins: 100 },
  { id: 'a-deaths', kind: 'achievement', title: 'Sin miedo al vacío', desc: 'Pierde 25 vidas', metric: 'deaths', target: 25, coins: 40 },
];
export const SPECIALS: Goal[] = [1, 2, 3, 4, 5].map((n) => ({
  id: `s-w${n}`,
  kind: 'special' as const,
  title: `Maestro del mundo ${n}`,
  desc: `Suma 10 estrellas en ${['Nebulosa', 'Sistemas binarios', 'Estación cuántica', 'Horizonte de fuego', 'Dimensión desconocida'][n - 1]}`,
  metric: `w${n}stars`,
  target: 10,
  coins: 150 + n * 60,
  crystals: 10 + n * 6,
}));
export const GOAL_MAP = Object.fromEntries([...DAILY_POOL, ...ACHIEVEMENTS, ...SPECIALS].map((g) => [g.id, g])) as Record<string, Goal>;
