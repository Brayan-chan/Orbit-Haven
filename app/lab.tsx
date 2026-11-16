/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import Svg, { Circle, Defs, G, Line, LinearGradient, Polygon, Polyline, RadialGradient, Rect, Stop } from 'react-native-svg';
import { ArrowLeft, RotateCcw } from 'lucide-react-native';
import { C, F } from '@/constants/theme';
import { orbitalControl } from '@/game/movement';

type Mode = 'orbit' | 'spiral' | 'wave' | 'recovery';
type Point = { x: number; y: number };
type LabState = {
  p: Point & { vx: number; vy: number };
  trail: Point[];
  holding: boolean;
  steer: number;
  startY: number;
  time: number;
  laps: number;
  lastAngle: number;
  flash: number;
};

const MODES: { id: Mode; label: string; help: string }[] = [
  { id: 'orbit', label: 'ÓRBITA', help: 'Mantén para abrir la órbita. Desliza arriba/abajo para maniobra tangencial.' },
  { id: 'spiral', label: 'ESPIRAL', help: 'Encadena pulsaciones y cambia el control tangencial para dibujar espirales.' },
  { id: 'wave', label: 'WAVE', help: 'Mantén para subir, suelta para bajar. Alterna para controlar la amplitud.' },
  { id: 'recovery', label: 'RECUPERACIÓN', help: 'Esquiva los núcleos rojos y corrige la trayectoria antes del impacto.' },
];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function initial(mode: Mode, w: number, h: number): LabState {
  if (mode === 'wave') return { p: { x: 80, y: h * 0.5, vx: 245, vy: 0 }, trail: [], holding: false, steer: 0, startY: 0, time: 0, laps: 0, lastAngle: 0, flash: 0 };
  const cx = w * 0.43;
  const cy = h * 0.52;
  const radius = mode === 'recovery' ? 155 : 118;
  const mu = mode === 'spiral' ? 4.4e6 : 3.8e6;
  return { p: { x: cx - radius, y: cy, vx: 0, vy: -Math.sqrt(mu / radius) }, trail: [], holding: false, steer: 0, startY: 0, time: 0, laps: 0, lastAngle: Math.PI, flash: 0 };
}

export default function PhysicsLab() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const portrait = width < height;
  const [mode, setMode] = useState<Mode>('orbit');
  const [, setFrame] = useState(0);
  const state = useRef<LabState>(initial(mode, width, height));
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    return () => { ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {}); };
  }, []);

  const reset = (next = mode) => {
    state.current = initial(next, width, height);
    setFrame((f) => f + 1);
  };

  useEffect(() => { reset(mode); }, [mode, width, height]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (portrait) return;
    let raf = 0;
    let last = 0;
    let acc = 0;
    let renderAt = 0;
    const dt = 1 / 120;
    const tick = (now: number) => {
      const real = last ? Math.min(0.04, (now - last) / 1000) : 1 / 60;
      last = now;
      acc += real;
      while (acc >= dt) {
        step(state.current, modeRef.current, width, height, dt);
        acc -= dt;
      }
      if (now - renderAt > 15.5) { renderAt = now; setFrame((f) => f + 1); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [portrait, width, height]);

  const s = state.current;
  const modeInfo = MODES.find((m) => m.id === mode)!;
  const speed = Math.hypot(s.p.vx, s.p.vy);
  const center = useMemo(() => ({ x: width * 0.43, y: height * 0.52 }), [width, height]);
  const radius = Math.hypot(s.p.x - center.x, s.p.y - center.y);
  const angular = Math.abs((s.p.x - center.x) * s.p.vy - (s.p.y - center.y) * s.p.vx);

  const begin = (y: number) => { s.holding = true; s.startY = y; s.steer = 0; };
  const move = (y: number) => { if (s.holding && mode !== 'wave') s.steer = clamp((s.startY - y) / 90, -1, 1); };
  const end = () => { s.holding = false; s.steer *= 0.35; };

  return (
    <View style={styles.root}>
      <LabCanvas state={s} mode={mode} width={width} height={height} />
      <View
        style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => begin(e.nativeEvent.locationY)}
        onResponderMove={(e) => move(e.nativeEvent.locationY)}
        onResponderRelease={end}
        onResponderTerminate={end}
      />

      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View style={styles.top} pointerEvents="box-none">
          <Pressable style={styles.icon} onPress={() => router.replace('/')}><ArrowLeft size={20} color={C.text} /></Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>LABORATORIO DE FÍSICAS</Text>
            <Text style={styles.help}>{modeInfo.help}</Text>
          </View>
          <Pressable style={styles.icon} onPress={() => reset()}><RotateCcw size={20} color={C.text} /></Pressable>
        </View>

        <View style={styles.metrics} pointerEvents="none">
          <Metric label="VELOCIDAD" value={Math.round(speed)} />
          {mode !== 'wave' && <Metric label="RADIO" value={Math.round(radius)} />}
          {mode !== 'wave' && <Metric label="MOMENTO" value={Math.round(angular / 100)} />}
          {mode !== 'wave' && <Metric label="VUELTAS" value={s.laps.toFixed(1)} />}
          <Metric label={mode === 'wave' ? 'ESTADO' : 'TANGENCIAL'} value={mode === 'wave' ? (s.holding ? 'SUBE' : 'BAJA') : `${s.steer >= 0 ? '+' : ''}${s.steer.toFixed(2)}`} />
        </View>

        <View style={styles.tabs} pointerEvents="box-none">
          {MODES.map((m) => <Pressable key={m.id} onPress={() => setMode(m.id)} style={[styles.tab, mode === m.id && styles.tabOn]}><Text style={[styles.tabText, mode === m.id && { color: C.text }]}>{m.label}</Text></Pressable>)}
        </View>
      </View>
      {portrait && <View style={styles.rotate}><Text style={styles.title}>Gira el dispositivo para probar las físicas</Text></View>}
    </View>
  );
}

function step(s: LabState, mode: Mode, w: number, h: number, dt: number) {
  s.time += dt;
  s.flash = Math.max(0, s.flash - dt * 3);
  if (mode === 'wave') {
    const target = s.holding ? -265 : 265;
    s.p.vy += (target - s.p.vy) * Math.min(1, dt * 18);
    s.p.x += s.p.vx * dt;
    s.p.y += s.p.vy * dt;
    const gates = waveGates(w, h);
    const hit = s.p.y < 44 || s.p.y > h - 44 || gates.some((g) => s.p.x + 7 > g.x && s.p.x - 7 < g.x + g.w && (s.p.y - 7 < g.top || s.p.y + 7 > g.bottom));
    if (hit || s.p.x > w + 20) {
      const next = initial('wave', w, h);
      next.flash = hit ? 1 : 0;
      Object.assign(s, next);
    }
  } else {
    const cx = w * 0.43;
    const cy = h * 0.52;
    const dx = cx - s.p.x;
    const dy = cy - s.p.y;
    const r = Math.max(32, Math.hypot(dx, dy));
    const mu = mode === 'spiral' ? 4.4e6 : 3.8e6;
    let grav = mu / (r * r + 700);
    if (s.holding) grav *= 0.62;
    let ax = dx / r * grav;
    let ay = dy / r * grav;
    if (s.holding) {
      const radial = mode === 'spiral' ? 430 : 390;
      const force = orbitalControl({ px: s.p.x, py: s.p.y, vx: s.p.vx, vy: s.p.vy, cx, cy, thrust: 1, steer: s.steer, radialPower: radial, tangentPower: 310 });
      ax += force.ax;
      ay += force.ay;
    } else if (Math.abs(s.steer) > 0.02) {
      s.steer *= Math.pow(0.25, dt);
    }
    const drag = mode === 'recovery' ? 0.9992 : 0.9996;
    s.p.vx = (s.p.vx + ax * dt) * Math.pow(drag, dt * 120);
    s.p.vy = (s.p.vy + ay * dt) * Math.pow(drag, dt * 120);
    const speed = Math.hypot(s.p.vx, s.p.vy);
    if (speed > 520) { s.p.vx *= 520 / speed; s.p.vy *= 520 / speed; }
    s.p.x += s.p.vx * dt;
    s.p.y += s.p.vy * dt;
    const angle = Math.atan2(s.p.y - cy, s.p.x - cx);
    let da = angle - s.lastAngle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    s.laps += Math.abs(da) / (Math.PI * 2);
    s.lastAngle = angle;
    const hazards = mode === 'recovery' ? recoveryHazards(w, h) : [];
    const hit = r < 29 || s.p.x < 15 || s.p.x > w - 15 || s.p.y < 15 || s.p.y > h - 15 || hazards.some((q) => Math.hypot(s.p.x - q.x, s.p.y - q.y) < q.r + 7);
    if (hit) { const next = initial(mode, w, h); next.flash = 1; Object.assign(s, next); }
  }
  s.trail.push({ x: s.p.x, y: s.p.y });
  if (s.trail.length > 100) s.trail.shift();
}

function waveGates(w: number, h: number) {
  return [
    { x: w * 0.28, w: 38, top: h * 0.28, bottom: h * 0.68 },
    { x: w * 0.5, w: 42, top: h * 0.48, bottom: h * 0.86 },
    { x: w * 0.72, w: 40, top: h * 0.18, bottom: h * 0.58 },
  ];
}

function recoveryHazards(w: number, h: number) {
  return [{ x: w * 0.23, y: h * 0.25, r: 24 }, { x: w * 0.64, y: h * 0.3, r: 28 }, { x: w * 0.69, y: h * 0.72, r: 24 }, { x: w * 0.3, y: h * 0.8, r: 22 }];
}

function LabCanvas({ state: s, mode, width: w, height: h }: { state: LabState; mode: Mode; width: number; height: number }) {
  const points = s.trail.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const cx = w * 0.43;
  const cy = h * 0.52;
  const gates = waveGates(w, h);
  return <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
    <Defs>
      <RadialGradient id="bg"><Stop offset="0" stopColor="#17245C" /><Stop offset="1" stopColor="#030615" /></RadialGradient>
      <RadialGradient id="well"><Stop offset="0" stopColor="#000" /><Stop offset="0.4" stopColor="#120026" /><Stop offset="0.72" stopColor="#A13CFF" stopOpacity="0.8" /><Stop offset="1" stopColor="#35E0FF" stopOpacity="0" /></RadialGradient>
      <LinearGradient id="trail" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#9B5CFF" /><Stop offset="1" stopColor="#35E0FF" /></LinearGradient>
    </Defs>
    <Rect width={w} height={h} fill="url(#bg)" />
    {Array.from({ length: 70 }, (_, i) => <Circle key={i} cx={(i * 83) % w} cy={(i * 47) % h} r={i % 7 === 0 ? 1.5 : 0.7} fill="#FFFFFF" opacity={0.18 + (i % 5) * 0.1} />)}
    {mode !== 'wave' && <G transform={`translate(${cx} ${cy})`}><Circle r={115} fill="url(#well)" /><Circle r={29} fill="#000" stroke="#FF62D8" strokeWidth={2} /><Circle r={150} fill="none" stroke="#35E0FF" strokeOpacity={0.12} strokeDasharray="4 10" /></G>}
    {mode === 'wave' && gates.map((g, i) => <G key={i}><Rect x={g.x} y={35} width={g.w} height={g.top - 35} fill="#2A0B46" stroke="#FF4FD8" strokeWidth={2} /><Rect x={g.x} y={g.bottom} width={g.w} height={h - g.bottom - 35} fill="#2A0B46" stroke="#FF4FD8" strokeWidth={2} /></G>)}
    {mode === 'recovery' && recoveryHazards(w, h).map((q, i) => <G key={i}><Circle cx={q.x} cy={q.y} r={q.r * 2} fill="#FF3B5C" opacity={0.08} /><Circle cx={q.x} cy={q.y} r={q.r} fill="#3A0A18" stroke="#FF3B5C" strokeWidth={3} /><Circle cx={q.x} cy={q.y} r={q.r + 8 + Math.sin(s.time * 5 + i) * 3} fill="none" stroke="#FF8A2A" strokeOpacity={0.5} /></G>)}
    {points && <><Polyline points={points} fill="none" stroke="#35E0FF" strokeOpacity={0.18} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" /><Polyline points={points} fill="none" stroke="url(#trail)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" /></>}
    {mode !== 'wave' && <Line x1={s.p.x} y1={s.p.y} x2={cx} y2={cy} stroke="#35E0FF" strokeOpacity={0.16} strokeDasharray="3 7" />}
    <G transform={`translate(${s.p.x} ${s.p.y}) rotate(${Math.atan2(s.p.vy, s.p.vx) * 180 / Math.PI})`}><Circle r={20} fill="#35E0FF" opacity={0.12} /><Polygon points="10,0 -6,-7 -3,0 -6,7" fill="#FFFFFF" stroke="#35E0FF" strokeWidth={2} />{s.holding && <Line x1={-4} y1={0} x2={-25} y2={0} stroke="#35E0FF" strokeWidth={5} strokeLinecap="round" />}</G>
    {s.flash > 0 && <Rect width={w} height={h} fill="#FF3B5C" opacity={s.flash * 0.3} />}
  </Svg>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#030615' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  icon: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(6,12,40,0.82)', borderWidth: 1.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  title: { color: C.text, fontFamily: F.black, fontSize: 16, letterSpacing: 1.5 },
  help: { color: C.dim, fontFamily: F.semi, fontSize: 11, marginTop: 2 },
  metrics: { position: 'absolute', top: 72, left: 12, flexDirection: 'row', gap: 6 },
  metric: { minWidth: 76, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(6,12,40,0.78)', borderWidth: 1, borderColor: C.lineSoft },
  metricLabel: { color: C.dim, fontFamily: F.bold, fontSize: 8, letterSpacing: 1 },
  metricValue: { color: C.cyan, fontFamily: F.bold, fontSize: 14 },
  tabs: { position: 'absolute', left: 12, right: 12, bottom: 10, flexDirection: 'row', gap: 7, justifyContent: 'center' },
  tab: { minWidth: 110, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(6,12,40,0.86)', borderWidth: 1, borderColor: C.lineSoft, alignItems: 'center' },
  tabOn: { borderColor: C.cyan, backgroundColor: 'rgba(25,70,115,0.9)' },
  tabText: { color: C.dim, fontFamily: F.bold, fontSize: 11, letterSpacing: 0.8 },
  rotate: { ...StyleSheet.absoluteFill, backgroundColor: '#030615', alignItems: 'center', justifyContent: 'center', padding: 30 },
});
