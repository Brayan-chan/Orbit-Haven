import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import { ChevronsRight, Gem, Heart, Hourglass, Magnet, Pause, Play, RotateCcw, Shield, Smartphone, Star, Zap, Home } from 'lucide-react-native';
import { C, F, glow } from '@/constants/theme';
import { SpaceBackdrop, GlowButton, Panel } from '@/components/ui';
import { GameCanvas } from '@/components/GameCanvas';
/* eslint-disable react-hooks/immutability, react-hooks/refs, react-hooks/set-state-in-effect */
import { DT, Sim, activateAbility, computeScore, createSim, stepSim, updateCamera } from '@/game/engine';
import { getLevel, nextLevelId } from '@/game/levels';
import { ABILITY_LIST, ITEM_MAP, WORLDS } from '@/game/catalog';
import { RunRewards, buildSimOpts, useGame, isUnlocked } from '@/store/GameStore';
import { haptic, setThrust, sfx, startMusic, stopMusic, unlockAudio } from '@/lib/audio';
import type { AbilityId } from '@/game/types';

const ICONS: Record<string, any> = { Shield, Hourglass, Magnet, Zap, ChevronsRight };

export default function PlayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lvl = getLevel(id);
  const router = useRouter();
  const { save } = useGame();

  useEffect(() => {
    const lock = async (o: any) => {
      try {
        await ScreenOrientation.lockAsync(o);
      } catch {}
    };
    lock(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      stopMusic();
      lock(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  if (!lvl || !isUnlocked(save, lvl.id)) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 18 }}>Nivel bloqueado</Text>
        <GlowButton label="Volver al mapa" onPress={() => router.replace('/worlds')} />
      </View>
    );
  }
  return <Run key={lvl.id} id={lvl.id} />;
}

type Phase = 'ready' | 'playing' | 'paused' | 'won' | 'over';

function Run({ id }: { id: string }) {
  const lvl = getLevel(id)!;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { save, endRun } = useGame();
  const world = WORLDS[lvl.world - 1];
  const [runId, setRunId] = useState(0);
  const sim = useMemo<Sim>(() => createSim(lvl, buildSimOpts(save)), [runId]); // eslint-disable-line
  const [phase, setPhase] = useState<Phase>('ready');
  const [frame, setFrame] = useState(0);
  const [hud, setHud] = useState(() => snap(sim));
  const [rewards, setRewards] = useState<RunRewards | null>(null);
  const [banner, setBanner] = useState('');
  const [toast, setToast] = useState('');
  const [hint, setHint] = useState(true);
  const portrait = width < height;
  const visW = (width / height) * 500;
  const skin = ITEM_MAP[save.equipped.particle];
  const trail = ITEM_MAP[save.equipped.trail];
  const shieldC = ITEM_MAP[save.equipped.shield].colors[0];
  const theme = ITEM_MAP[save.equipped.theme];
  const pal = theme.pal ?? world.pal;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    updateCamera(sim, visW, 1, true);
    setFrame((f) => f + 1);
  }, [sim, visW]);

  const say = (t: string, ms = 1800, set = setToast) => {
    set(t);
    setTimeout(() => set(''), ms);
  };

  const finish = () => {
    const sc = computeScore(sim);
    const won = sim.mode === 'won';
    const r = endRun(lvl.id, { score: sc.total, crystals: sim.crystals, dark: sim.dark, secrets: sim.secrets, nearMiss: sim.nearMiss, distance: sim.distance, time: sim.t, livesLost: sim.livesLost, abilities: sim.abilitiesUsed, stars: won ? sim.stars : 0, completed: won });
    setRewards(r);
    setThrust(false);
    setPhase(won ? 'won' : 'over');
    if (!won) sfx('lose');
  };

  useEffect(() => {
    if (phase !== 'playing' || portrait) return;
    let raf = 0;
    let last = 0;
    let acc = 0;
    let hudT = 0;
    let endT = 0;
    let renderAt = 0;
    const tick = (now: number) => {
      const dtr = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      acc += dtr;
      while (acc >= DT) {
        stepSim(sim, DT);
        acc -= DT;
      }
      updateCamera(sim, visW, dtr);
      for (const e of sim.events) {
        switch (e.type) {
          case 'crystal': sfx('crystal'); haptic('light'); break;
          case 'dark': case 'secret': sfx('dark'); haptic('medium'); break;
          case 'hit': sfx('hit'); haptic('heavy'); say(e.text ?? '', 1500, setToast); break;
          case 'shieldBreak': sfx('shield'); haptic('medium'); break;
          case 'nearmiss': sfx('near'); haptic('light'); break;
          case 'portal': sfx('portal'); haptic('medium'); break;
          case 'zone': sfx('zone'); say(e.text ?? '', 2200, setBanner); break;
          case 'escape': sfx('escape'); haptic('medium'); say('¡HONDA GRAVITACIONAL!', 1300, setBanner); break;
          case 'ability': sfx('ability'); haptic('medium'); break;
          case 'denied': sfx('denied'); break;
          case 'mine': sfx('mine'); haptic('heavy'); break;
          case 'respawn': sfx('respawn'); break;
          case 'locked':
            sfx('denied');
            say(e.text === 'orbit' ? 'Completa la calibración orbital' : `Necesitas ${lvl.minCrystals} cristales para abrir el portal`, 1800);
            break;
          case 'won': sfx('win'); haptic('success'); break;
        }
      }
      sim.events.length = 0;
      if (now - renderAt >= 15.5) {
        renderAt = now;
        setFrame((f) => f + 1);
      }
      hudT += dtr;
      if (hudT > 0.1) {
        hudT = 0;
        setHud(snap(sim));
      }
      if (sim.mode === 'won' || sim.mode === 'dead') {
        endT += dtr;
        if (endT > (sim.mode === 'won' ? 1.5 : 1.1)) {
          setHud(snap(sim));
          finish();
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, portrait, sim, visW]); // eslint-disable-line

  const hold = (on: boolean) => {
    sim.holding = on;
    if (!on) sim.steer = 0;
    setThrust(on && phaseRef.current === 'playing');
    if (on) setHint(false);
  };
  const start = () => {
    unlockAudio();
    startMusic(world.id, world.root);
    setPhase('playing');
    setTimeout(() => setHint(false), 9000);
  };
  const act = (a: AbilityId) => {
    if (phaseRef.current === 'playing') activateAbility(sim, a);
  };
  const retry = () => {
    setRewards(null);
    setHint(true);
    setPhase('ready');
    setRunId((r) => r + 1);
  };
  const exit = () => router.replace(`/levels/${lvl.world}` as any);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const dn = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (phaseRef.current === 'ready') start();
        else hold(true);
      }
      const i = Number(e.key) - 1;
      const list = ABILITY_LIST.filter((a) => sim.abil[a.id]);
      if (i >= 0 && list[i]) act(list[i].id);
      if (e.code === 'Escape') setPhase((p) => (p === 'playing' ? 'paused' : p));
    };
    const up = (e: KeyboardEvent) => (e.code === 'Space' || e.code === 'ArrowUp') && hold(false);
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', dn);
      window.removeEventListener('keyup', up);
    };
  }, [sim]); // eslint-disable-line

  const abil = ABILITY_LIST.filter((a) => sim.abil[a.id]);
  const padL = Math.max(insets.left, 12);
  const padR = Math.max(insets.right, 12);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SpaceBackdrop palette={pal} stars={false} />
      <GameCanvas sim={sim} frame={frame} width={width} height={height} accent={pal.accent} skin={skin} trail={trail} shieldColor={shieldC} />
      {phase === 'playing' && <Pressable style={StyleSheet.absoluteFill} onPressIn={() => hold(true)} onPressOut={() => hold(false)} />}

      {/* HUD */}
      <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { paddingTop: Math.max(insets.top, 8), paddingLeft: padL, paddingRight: padR, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={s.top} pointerEvents="box-none">
          <Pressable accessibilityLabel="Pausa" onPress={() => phase === 'playing' && setPhase('paused')} style={s.pause}>
            <Pause size={18} color={C.text} />
          </Pressable>
          <View style={s.pill}>
            <Gem size={15} color={C.cyan} />
            <Text style={s.pillT}>{hud.crystals}{lvl.minCrystals > 0 ? `/${lvl.minCrystals}` : ''}</Text>
          </View>
          <View style={s.pill}>
            <Star size={15} color={C.gold} fill={C.gold} />
            <Text style={s.pillT}>{hud.score}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={s.lvlT}>NIVEL {lvl.id}</Text>
            {lvl.id === '1-1' && <Text style={[s.lvlT, { color: C.gold, fontSize: 9 }]}>VERTICAL SLICE · FÍSICA V2</Text>}
            <View style={s.prog}>
              <View style={{ width: `${hud.progress * 100}%`, height: '100%', backgroundColor: C.cyan, borderRadius: 2 }} />
            </View>
          </View>
          <View style={[s.pill, { gap: 4 }]}>
            {Array.from({ length: hud.maxLives }).map((_, i) => (
              <Heart key={i} size={17} color={C.red} fill={i < hud.lives ? C.red : 'transparent'} />
            ))}
          </View>
        </View>
        <View style={{ marginTop: 8, gap: 6, alignItems: 'flex-start' }} pointerEvents="none">
          {hud.slow > 0 && <Timer icon={<Hourglass size={14} color={C.cyan} />} t={hud.slow} />}
          {hud.shield > 0 && hud.shield < 100 && <Timer icon={<Shield size={14} color="#B26BFF" />} t={hud.shield} />}
          {hud.shield >= 100 && <Timer icon={<Shield size={14} color="#B26BFF" />} t={-1} />}
          {hud.magnet > 0 && <Timer icon={<Magnet size={14} color="#FF4F6D" />} t={hud.magnet} />}
          {hud.oob && <Text style={s.warn}>FUERA DE ZONA · REGRESA</Text>}
          {lvl.world === 1 && lvl.index < 3 && <Text style={s.debug}>VX {hud.vx} · VY {hud.vy} → {hud.targetVy} · CTRL {hud.controlAy} · G {hud.gravity}</Text>}
        </View>
        <View style={{ flex: 1 }} pointerEvents="none" />
        <View style={s.bottom} pointerEvents="box-none">
          {hint && phase !== 'won' && phase !== 'over' && lvl.hint ? (
            <View style={s.hint} pointerEvents="none">
              <Text style={s.hintT}>{lvl.minOrbits && hud.orbits < lvl.minOrbits ? `CALIBRANDO ÓRBITA · ${Math.floor(Math.min(1, hud.orbits / lvl.minOrbits) * 100)}%` : lvl.hint}</Text>
            </View>
          ) : <View />}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {abil.map((a, i) => {
              const st = hud.abil.find((x) => x.id === a.id);
              const Ic = ICONS[a.icon];
              const ready = st && st.charges > 0 && st.cd <= 0;
              return (
                <Pressable key={a.id} accessibilityLabel={a.name} onPress={() => act(a.id)} style={[s.ab, { borderColor: ready ? a.color : C.faint, opacity: st && st.charges > 0 ? 1 : 0.4 }, ready && glow(a.color, 10, 0.5)]}>
                  <Ic size={22} color={ready ? a.color : C.dim} />
                  <Text style={s.abN}>{st && st.cd > 0 ? Math.ceil(st.cd) : st?.charges}</Text>
                  {Platform.OS === 'web' && <Text style={s.key}>{i + 1}</Text>}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {!!banner && (
        <View pointerEvents="none" style={s.center}>
          <Text style={s.bannerS}>NUEVA ZONA</Text>
          <Text style={s.bannerT}>{banner}</Text>
        </View>
      )}
      {!!toast && (
        <View pointerEvents="none" style={[s.center, { top: '62%' }]}>
          <Text style={s.toast}>{toast}</Text>
        </View>
      )}

      {phase === 'ready' && !portrait && (
        <Pressable style={s.overlay} onPress={start}>
          <Panel style={{ width: 430, maxWidth: '88%', alignItems: 'center', gap: 6 }} accent={world.pal.accent}>
            <Text style={[s.small, { color: world.pal.accent }]}>MUNDO {world.id} · {world.name.toUpperCase()}</Text>
            {lvl.id === '1-1' && <Text style={[s.small, { color: C.gold }]}>BUILD DE PRUEBA · VERTICAL SLICE V2</Text>}
            <Text style={s.big}>{lvl.id} · {lvl.name}</Text>
            <Text style={s.sub}>{lvl.subtitle}</Text>
            <View style={{ flexDirection: 'row', gap: 4, marginVertical: 6 }}>
              {[1, 2, 3].map((n) => <Star key={n} size={18} color={C.gold} fill={(save.levels[lvl.id]?.stars ?? 0) >= n ? C.gold : 'transparent'} />)}
            </View>
            <Text style={s.sub}>
              {lvl.minCrystals > 0 ? `Reúne ${lvl.minCrystals} cristales y alcanza el portal.` : 'Alcanza el portal de salida.'}
            </Text>
            <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Play size={18} color={C.cyan} fill={C.cyan} />
              <Text style={[s.bannerS, { fontSize: 14 }]}>TOCA PARA EMPEZAR · MANTÉN PARA ALEJARTE</Text>
            </View>
          </Panel>
        </Pressable>
      )}

      {phase === 'paused' && (
        <View style={s.overlay}>
          <Panel style={{ width: 340, maxWidth: '88%', gap: 10 }}>
            <Text style={[s.big, { textAlign: 'center' }]}>Pausa</Text>
            <GlowButton variant="primary" label="Continuar" icon={<Play size={18} color={C.text} />} onPress={() => setPhase('playing')} />
            <GlowButton label="Reiniciar" icon={<RotateCcw size={18} color={C.text} />} onPress={retry} />
            <GlowButton label="Salir al mapa" icon={<Home size={18} color={C.text} />} onPress={exit} />
          </Panel>
        </View>
      )}

      {(phase === 'won' || phase === 'over') && rewards && (
        <Result won={phase === 'won'} sim={sim} rewards={rewards} lvlId={lvl.id} onRetry={retry} onExit={exit} onNext={() => { const n = nextLevelId(lvl.id); if (n) router.replace(`/play/${n}` as any); }} />
      )}

      {portrait && (
        <View style={[s.overlay, { backgroundColor: 'rgba(3,5,20,0.96)', gap: 14 }]}>
          <Smartphone size={54} color={C.cyan} style={{ transform: [{ rotate: '90deg' }] }} />
          <Text style={s.big}>Gira tu dispositivo</Text>
          <Text style={s.sub}>Las partidas se juegan en horizontal</Text>
        </View>
      )}
    </View>
  );
}

function snap(sim: Sim) {
  const sc = computeScore(sim);
  return {
    lives: sim.lives,
    maxLives: sim.maxLives,
    crystals: sim.crystals,
    score: sc.total,
    progress: Math.max(0, Math.min(1, sim.p.x / sim.level.exit.x)),
    orbits: sim.orbitTravel / (Math.PI * 2),
    vx: Math.round(sim.p.vx),
    vy: Math.round(sim.p.vy),
    targetVy: Math.round(sim.targetVy),
    controlAy: Math.round(sim.controlAy),
    gravity: Math.round(Math.hypot(sim.gravityAx, sim.gravityAy)),
    slow: sim.slowT,
    shield: sim.shield ? (sim.shieldT > 9000 ? 100 : sim.shieldT) : 0,
    magnet: sim.magnetT,
    oob: sim.oobT > 0.05,
    abil: (Object.keys(sim.abil) as AbilityId[]).map((k) => ({ id: k, charges: sim.abil[k]!.charges, cd: sim.abil[k]!.cd })),
  };
}

function Timer({ icon, t }: { icon: React.ReactNode; t: number }) {
  return (
    <View style={s.timer}>
      {icon}
      <Text style={s.pillT}>{t < 0 ? 'LISTO' : `00:${String(Math.ceil(t)).padStart(2, '0')}`}</Text>
    </View>
  );
}

function Result({ won, sim, rewards, lvlId, onRetry, onExit, onNext }: { won: boolean; sim: Sim; rewards: RunRewards; lvlId: string; onRetry: () => void; onExit: () => void; onNext: () => void }) {
  const sc = computeScore(sim);
  const rows: [string, string][] = [
    ['Puntuación', String(sc.total)],
    ['Cristales', `${sim.crystals}${sim.dark ? ` · +${sim.dark} materia oscura` : ''}`],
    ['Tiempo', `${sim.t.toFixed(1)} s`],
    ['Distancia', `${Math.round(sim.distance)} u`],
    ['Esquivados', String(sim.nearMiss)],
    ['Récord', rewards.record ? 'NUEVO RÉCORD' : String(rewards.prevBest)],
  ];
  const hasNext = !!nextLevelId(lvlId);
  return (
    <View style={[s.overlay, { backgroundColor: 'rgba(3,5,20,0.82)' }]}>
      <Panel style={{ width: 560, maxWidth: '94%', gap: 8 }} accent={won ? C.cyan : C.red}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={[s.big, { color: won ? C.cyan : C.red }]}>{won ? '¡Nivel completado!' : 'Sin vidas'}</Text>
            {!won && <Text style={s.sub}>Causa: {sim.lastHit || '—'}</Text>}
            {won && rewards.unlocked.map((u) => <Text key={u} style={[s.sub, { color: C.gold }]}>{u}</Text>)}
          </View>
          {won && (
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {[1, 2, 3].map((n) => <Star key={n} size={30} color={C.gold} fill={sim.stars >= n ? C.gold : 'transparent'} />)}
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {rows.map(([k, v]) => (
            <View key={k} style={{ width: '50%', paddingVertical: 3 }}>
              <Text style={s.small}>{k.toUpperCase()}</Text>
              <Text style={[s.sub, { color: C.text, fontFamily: F.bold }]}>{v}</Text>
            </View>
          ))}
        </View>
        <Text style={[s.sub, { color: C.gold }]}>
          Recompensas: +{rewards.coins} monedas · +{rewards.crystals} cristales{rewards.worldBonus ? ' (¡bonus de mundo completado!)' : ''}
        </Text>
        {won && sim.stars < 3 && <Text style={s.small}>3★: todos los cristales y máximo 1 vida perdida</Text>}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <GlowButton style={{ flex: 1 }} small label="Mapa" icon={<Home size={16} color={C.text} />} onPress={onExit} />
          <GlowButton style={{ flex: 1 }} small label="Reintentar" icon={<RotateCcw size={16} color={C.text} />} onPress={onRetry} />
          {won && hasNext && <GlowButton style={{ flex: 1 }} small variant="primary" label="Siguiente" icon={<Play size={16} color={C.text} />} onPress={onNext} />}
        </View>
      </Panel>
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pause: { width: 40, height: 40, borderRadius: 10, borderWidth: 1.5, borderColor: C.cyan, backgroundColor: 'rgba(6,12,40,0.75)', alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 38, borderRadius: 12, backgroundColor: 'rgba(6,12,40,0.7)', borderWidth: 1, borderColor: C.lineSoft },
  pillT: { color: C.text, fontFamily: F.bold, fontSize: 15 },
  lvlT: { color: C.text, fontFamily: F.bold, fontSize: 11, letterSpacing: 1 },
  prog: { width: '70%', maxWidth: 260, height: 4, borderRadius: 2, backgroundColor: 'rgba(143,163,214,0.25)', marginTop: 4, overflow: 'hidden' },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, height: 30, borderRadius: 10, backgroundColor: 'rgba(6,12,40,0.7)', borderWidth: 1, borderColor: C.lineSoft },
  warn: { color: C.red, fontFamily: F.black, fontSize: 13, letterSpacing: 1 },
  debug: { color: C.dim, fontFamily: F.semi, fontSize: 10, backgroundColor: 'rgba(3,6,21,0.72)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  hint: { flexShrink: 1, maxWidth: 380, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, backgroundColor: 'rgba(6,12,40,0.78)', borderWidth: 1, borderColor: C.lineSoft },
  hintT: { color: C.text, fontFamily: F.semi, fontSize: 13 },
  ab: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, backgroundColor: 'rgba(6,12,40,0.8)', alignItems: 'center', justifyContent: 'center' },
  abN: { position: 'absolute', right: -2, bottom: -2, minWidth: 18, textAlign: 'center', color: C.text, backgroundColor: '#14206A', borderRadius: 9, overflow: 'hidden', fontFamily: F.bold, fontSize: 11, paddingVertical: 1 },
  key: { position: 'absolute', left: 4, top: 1, color: C.dim, fontFamily: F.bold, fontSize: 10 },
  center: { position: 'absolute', top: '24%', left: 0, right: 0, alignItems: 'center' },
  bannerS: { color: C.cyan, fontFamily: F.bold, fontSize: 12, letterSpacing: 3 },
  bannerT: { color: C.text, fontFamily: F.italic, fontSize: 30 },
  toast: { color: C.text, fontFamily: F.bold, fontSize: 14, backgroundColor: 'rgba(6,12,40,0.8)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, overflow: 'hidden' },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(3,5,20,0.55)' },
  big: { color: C.text, fontFamily: F.italic, fontSize: 24 },
  sub: { color: C.dim, fontFamily: F.semi, fontSize: 13, textAlign: 'center' },
  small: { color: C.dim, fontFamily: F.bold, fontSize: 11, letterSpacing: 1.5 },
});
