import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

type Prefs = { music: boolean; sfx: boolean; haptics: boolean; musicVol: number; sfxVol: number };
const prefs: Prefs = { music: true, sfx: true, haptics: true, musicVol: 0.6, sfxVol: 0.8 };
let ctx: any = null;
let master: any = null;
let musicG: any = null;
let sfxG: any = null;
let thrustOsc: any = null;
let thrustG: any = null;
let timer: any = null;
let curWorld = 0;

function ensure() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    musicG = ctx.createGain();
    sfxG = ctx.createGain();
    musicG.connect(master);
    sfxG.connect(master);
    apply();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function apply() {
  if (!ctx) return;
  musicG.gain.value = prefs.music ? prefs.musicVol * 0.5 : 0;
  sfxG.gain.value = prefs.sfx ? prefs.sfxVol : 0;
}
export function configureAudio(p: Partial<Prefs>) {
  Object.assign(prefs, p);
  apply();
  if (!prefs.music) stopMusic();
}
export function unlockAudio() {
  ensure();
}

function tone(f: number, dur: number, type: string = 'sine', vol = 0.2, delay = 0, to?: number) {
  const c = ensure();
  if (!c || !prefs.sfx) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(sfxG);
  o.start(t);
  o.stop(t + dur + 0.05);
}
function noise(dur: number, vol: number, freq: number) {
  const c = ensure();
  if (!c || !prefs.sfx) return;
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource();
  s.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = vol;
  s.connect(f);
  f.connect(g);
  g.connect(sfxG);
  s.start();
}

export type Sfx = 'crystal' | 'dark' | 'hit' | 'shield' | 'near' | 'portal' | 'win' | 'zone' | 'ability' | 'denied' | 'ui' | 'buy' | 'mine' | 'respawn' | 'lose';
export function sfx(n: Sfx) {
  switch (n) {
    case 'crystal': tone(880, 0.12, 'sine', 0.18); tone(1320, 0.16, 'sine', 0.14, 0.06); break;
    case 'dark': tone(220, 0.3, 'triangle', 0.2, 0, 440); tone(660, 0.3, 'sine', 0.12, 0.08); break;
    case 'hit': noise(0.45, 0.5, 900); tone(160, 0.4, 'sawtooth', 0.25, 0, 40); break;
    case 'shield': tone(500, 0.3, 'square', 0.12, 0, 120); noise(0.2, 0.2, 3000); break;
    case 'near': noise(0.2, 0.18, 4000); tone(700, 0.15, 'sine', 0.08, 0, 1400); break;
    case 'portal': tone(300, 0.4, 'sine', 0.2, 0, 1200); tone(900, 0.3, 'triangle', 0.1, 0.1, 200); break;
    case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.45, 'triangle', 0.2, i * 0.11)); break;
    case 'zone': tone(392, 0.3, 'sine', 0.14); tone(588, 0.4, 'sine', 0.14, 0.12); break;
    case 'ability': tone(400, 0.35, 'sawtooth', 0.12, 0, 900); break;
    case 'denied': tone(180, 0.2, 'square', 0.12); break;
    case 'ui': tone(700, 0.06, 'sine', 0.1); break;
    case 'buy': tone(660, 0.1, 'triangle', 0.15); tone(990, 0.2, 'triangle', 0.15, 0.08); break;
    case 'mine': noise(0.5, 0.6, 700); tone(90, 0.5, 'sawtooth', 0.25, 0, 30); break;
    case 'respawn': tone(300, 0.4, 'sine', 0.16, 0, 800); break;
    case 'lose': [392, 330, 262].forEach((f, i) => tone(f, 0.5, 'triangle', 0.18, i * 0.18)); break;
  }
}

export function setThrust(on: boolean) {
  const c = ensure();
  if (!c || !prefs.sfx) return;
  if (!thrustOsc) {
    thrustOsc = c.createOscillator();
    thrustOsc.type = 'sawtooth';
    thrustOsc.frequency.value = 70;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 220;
    thrustG = c.createGain();
    thrustG.gain.value = 0;
    thrustOsc.connect(f);
    f.connect(thrustG);
    thrustG.connect(sfxG);
    thrustOsc.start();
  }
  thrustG.gain.setTargetAtTime(on ? 0.07 : 0, c.currentTime, 0.08);
}

const CHORDS = [[0, 7, 12, 15], [-2, 5, 10, 14], [-4, 3, 8, 12], [-5, 2, 7, 10]];
export function startMusic(world: number, root: number) {
  const c = ensure();
  if (!c || !prefs.music) return;
  if (curWorld === world && timer) return;
  stopMusic();
  curWorld = world;
  let i = 0;
  const play = () => {
    const t = c.currentTime;
    CHORDS[i % CHORDS.length].forEach((st) => {
      const f = root * Math.pow(2, st / 12);
      [0, 6].forEach((det) => {
        const o = c.createOscillator();
        const g = c.createGain();
        const fl = c.createBiquadFilter();
        fl.type = 'lowpass';
        fl.frequency.value = 700 + world * 80;
        o.type = det ? 'triangle' : 'sine';
        o.frequency.value = f;
        o.detune.value = det;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.09, t + 2.2);
        g.gain.linearRampToValueAtTime(0.0001, t + 6.4);
        o.connect(fl);
        fl.connect(g);
        g.connect(musicG);
        o.start(t);
        o.stop(t + 6.6);
      });
    });
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = root * 4 * Math.pow(2, CHORDS[i % 4][(i * 3) % 4] / 12);
    g.gain.setValueAtTime(0.0001, t + 1);
    g.gain.exponentialRampToValueAtTime(0.05, t + 1.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
    o.connect(g);
    g.connect(musicG);
    o.start(t + 1);
    o.stop(t + 3.1);
    i++;
    timer = setTimeout(play, 6000);
  };
  play();
}
export function stopMusic() {
  if (timer) clearTimeout(timer);
  timer = null;
  curWorld = 0;
  if (thrustG && ctx) thrustG.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
}

export function haptic(kind: 'light' | 'medium' | 'heavy' | 'success' | 'warning') {
  if (!prefs.haptics || Platform.OS === 'web') return;
  try {
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else Haptics.impactAsync(kind === 'light' ? Haptics.ImpactFeedbackStyle.Light : kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
  } catch {}
}
