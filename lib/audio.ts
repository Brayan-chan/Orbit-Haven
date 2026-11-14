import * as Haptics from 'expo-haptics';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

type Prefs = { music: boolean; sfx: boolean; haptics: boolean; musicVol: number; sfxVol: number };
const prefs: Prefs = { music: true, sfx: true, haptics: true, musicVol: 0.6, sfxVol: 0.8 };
const sources = {
  ambient: require('../assets/audio/ambient.wav'),
  thrust: require('../assets/audio/thrust.wav'),
  crystal: require('../assets/audio/crystal.wav'),
  near: require('../assets/audio/near.wav'),
  hit: require('../assets/audio/hit.wav'),
  portal: require('../assets/audio/portal.wav'),
  win: require('../assets/audio/win.wav'),
  ui: require('../assets/audio/ui.wav'),
  respawn: require('../assets/audio/respawn.wav'),
} as const;

type SoundKey = keyof typeof sources;
const players: Partial<Record<SoundKey, AudioPlayer>> = {};
let configured = false;
let curWorld = 0;

function player(key: SoundKey) {
  if (!players[key]) players[key] = createAudioPlayer(sources[key], { keepAudioSessionActive: true });
  return players[key]!;
}

function apply() {
  if (players.ambient) players.ambient.volume = prefs.music ? prefs.musicVol * 0.55 : 0;
  if (players.thrust) players.thrust.volume = prefs.sfx ? prefs.sfxVol * 0.18 : 0;
}

export function configureAudio(p: Partial<Prefs>) {
  Object.assign(prefs, p);
  if (!configured) {
    configured = true;
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
  }
  apply();
  if (!prefs.music) stopMusic();
}

export function unlockAudio() { configureAudio({}); }

function play(key: SoundKey, volume = 1, rate = 1) {
  if (!prefs.sfx) return;
  try {
    const p = player(key);
    p.volume = Math.min(1, prefs.sfxVol * volume);
    p.setPlaybackRate(rate);
    p.seekTo(0).then(() => p.play()).catch(() => p.play());
  } catch {}
}

export type Sfx = 'crystal' | 'dark' | 'hit' | 'shield' | 'near' | 'portal' | 'win' | 'zone' | 'escape' | 'ability' | 'denied' | 'ui' | 'buy' | 'mine' | 'respawn' | 'lose';

export function sfx(name: Sfx) {
  switch (name) {
    case 'crystal': play('crystal', 0.8); break;
    case 'dark': play('portal', 0.65, 0.78); break;
    case 'hit': case 'mine': case 'lose': play('hit', 1, name === 'lose' ? 0.75 : 1); break;
    case 'shield': play('hit', 0.45, 1.45); break;
    case 'near': play('near', 0.65); break;
    case 'portal': play('portal', 0.85); break;
    case 'win': play('win', 0.95); break;
    case 'zone': case 'escape': play('portal', 0.55, 1.25); break;
    case 'ability': play('portal', 0.55, 1.4); break;
    case 'denied': play('ui', 0.45, 0.6); break;
    case 'ui': play('ui', 0.45); break;
    case 'buy': play('crystal', 0.8, 1.15); break;
    case 'respawn': play('respawn', 0.75); break;
  }
}

export function setThrust(on: boolean, intensity = 1) {
  try {
    const p = player('thrust');
    p.loop = true;
    p.volume = on && prefs.sfx ? prefs.sfxVol * 0.18 * Math.max(0.25, intensity) : 0;
    if (on && !p.playing) p.play();
  } catch {}
}

export function startMusic(world: number, root: number) {
  if (!prefs.music) return;
  try {
    const p = player('ambient');
    if (curWorld === world && p.playing) return;
    curWorld = world;
    p.loop = true;
    p.volume = prefs.musicVol * 0.55;
    p.setPlaybackRate(0.96 + world * 0.015);
    p.play();
  } catch {}
}

export function stopMusic() {
  curWorld = 0;
  players.ambient?.pause();
  players.thrust?.pause();
}

export function haptic(kind: 'light' | 'medium' | 'heavy' | 'success' | 'warning') {
  if (!prefs.haptics) return;
  if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else if (kind === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  else {
    const style = kind === 'light' ? Haptics.ImpactFeedbackStyle.Light : kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy;
    Haptics.impactAsync(style).catch(() => {});
  }
}
