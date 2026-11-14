import React, { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, G, Line, Polygon, Polyline, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { EXIT_R, MAGNET_R, Sim } from '@/game/engine';
import { Item } from '@/game/catalog';
import { StarLayer } from '@/components/ui';

const GRADS: [string, string][] = [['gCyan', '#35E0FF'], ['gMag', '#FF4FD8'], ['gRed', '#FF3B5C'], ['gOrange', '#FF8A2A'], ['gGold', '#FFC83D'], ['gViolet', '#9B5CFF'], ['gWhite', '#FFFFFF']];

export function GameCanvas({ sim, frame, width, height, accent, skin, trail, shieldColor }: { sim: Sim; frame: number; width: number; height: number; accent: string; skin: Item; trail: Item; shieldColor: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const g = (n: string) => `url(#${uid}${n})`;
  const sc = height / 500;
  const visW = width / sc;
  const cam = sim.camX;
  const s = sim;
  const p = s.p;
  const clk = s.clock;
  const lvl = s.level;
  const vis = (x: number, r = 60) => x + r > cam - 20 && x - r < cam + visW + 20;
  const skinGlow = skin.colors[1];
  const alive = s.mode === 'play' || s.mode === 'won';
  const tr = s.trail;
  const chunks: React.ReactElement[] = [];
  if (tr.length > 3) {
    const n = 5;
    const per = Math.ceil(tr.length / n);
    for (let c = 0; c < n; c++) {
      const a = c * per;
      const pts = tr.slice(Math.max(0, a - 1), Math.min(tr.length, a + per + 1));
      if (pts.length < 2) continue;
      const col = trail.colors[Math.min(trail.colors.length - 1, Math.floor((c / n) * trail.colors.length))];
      const str = pts.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
      const k = (c + 1) / n;
      chunks.push(<Polyline key={`a${c}`} points={str} stroke={col} strokeWidth={4 + k * 9} strokeOpacity={0.12 * k + 0.04} fill="none" strokeLinecap="round" />);
      chunks.push(<Polyline key={`b${c}`} points={str} stroke={col} strokeWidth={1.5 + k * 3.5} strokeOpacity={0.35 + k * 0.6} fill="none" strokeLinecap="round" />);
    }
  }
  const unlocked = s.crystals >= lvl.minCrystals && s.orbitTravel >= (lvl.minOrbits ?? 0) * Math.PI * 2;
  const ec = unlocked ? '#35E0FF' : '#FF3B5C';
  const ex = lvl.exit;
  const blink = s.invuln > 0 && Math.floor(clk * 14) % 2 === 0;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        {GRADS.map(([id, c]) => (
          <RadialGradient key={id} id={`${uid}${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={c} stopOpacity="0.85" />
            <Stop offset="0.5" stopColor={c} stopOpacity="0.25" />
            <Stop offset="1" stopColor={c} stopOpacity="0" />
          </RadialGradient>
        ))}
        <RadialGradient id={`${uid}skin`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={skinGlow} stopOpacity="0.9" />
          <Stop offset="1" stopColor={skinGlow} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <G transform={`translate(${-cam * 0.15 * sc} 0) scale(${sc})`}>
        <StarLayer w={lvl.width * 0.2 + 1000} h={500} n={50} seed={5} tint={accent} />
      </G>
      <G transform={`translate(${-cam * 0.4 * sc} 0) scale(${sc})`}>
        <StarLayer w={lvl.width * 0.5 + 1000} h={500} n={30} seed={9} tint={accent} />
      </G>
      <G transform={`translate(${-cam * sc} 0) scale(${sc})`}>
        {/* zonas de peligro: límites */}
        <Line x1={0} y1={0} x2={lvl.width} y2={0} stroke="#FF3B5C" strokeOpacity={s.oobT > 0 ? 0.8 : 0.1} strokeWidth={2} />
        <Line x1={0} y1={500} x2={lvl.width} y2={500} stroke="#FF3B5C" strokeOpacity={s.oobT > 0 ? 0.8 : 0.1} strokeWidth={2} />

        {s.wells.map((w, i) => {
          if (!vis(w.x, w.infl)) return null;
          const inv = w.kind === 'inverse';
          const hos = w.kind === 'hostile';
          const c1 = inv ? '#9BF3FF' : hos ? '#FF3B5C' : '#FF8A2A';
          const c2 = inv ? '#35E0FF' : hos ? '#FF8A2A' : '#FF4FD8';
          const c3 = inv ? '#FFFFFF' : hos ? '#B01E5B' : '#9B5CFF';
          const R = w.core;
          const act = s.center === w;
          return (
            <G key={`w${i}`} transform={`translate(${w.x} ${w.y})`}>
              <Circle r={w.infl * 0.62} fill="none" stroke={c2} strokeOpacity={act ? 0.35 : 0.1} strokeWidth={1.3} strokeDasharray="3 9" />
              <Circle r={R * 5} fill={g(inv ? 'gCyan' : hos ? 'gRed' : 'gMag')} />
              <G transform={`rotate(${clk * 35})`}>
                <Circle r={R * 1.95} fill="none" stroke={c3} strokeWidth={R * 0.35} strokeOpacity={0.55} strokeDasharray={`${R * 2.4} ${R * 1.2}`} />
              </G>
              <G transform={`rotate(${-clk * 60})`}>
                <Circle r={R * 1.55} fill="none" stroke={c2} strokeWidth={R * 0.28} strokeOpacity={0.7} strokeDasharray={`${R * 1.8} ${R * 1.4}`} />
              </G>
              <G transform={`rotate(${clk * 110})`}>
                <Circle r={R * 1.25} fill="none" stroke={c1} strokeWidth={R * 0.18} strokeOpacity={0.9} strokeDasharray={`${R * 1.2} ${R * 1.6}`} />
              </G>
              {inv ? <Circle r={R + ((clk * 50) % (w.infl * 0.8))} fill="none" stroke="#9BF3FF" strokeOpacity={0.3} strokeWidth={1.5} /> : <Circle r={R} fill="#000" stroke={c1} strokeWidth={2.5} />}
              {inv && <Circle r={R} fill="#021018" stroke={c1} strokeWidth={2} />}
            </G>
          );
        })}

        {s.portals.map((q, i) => vis(q.x) && (
          <G key={`p${i}`} transform={`translate(${q.x} ${q.y})`}>
            <Circle r={34} fill={g('gViolet')} />
            <G transform={`rotate(${clk * 90 * (i % 2 ? -1 : 1)})`}>
              <Circle r={19} fill="none" stroke="#B26BFF" strokeWidth={3} strokeDasharray="8 6" />
            </G>
            <Circle r={9} fill="#0A0420" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={1.5} />
          </G>
        ))}

        {s.pickups.map((c, i) => {
          if (c.taken || !vis(c.x, 20)) return null;
          const bob = Math.sin(clk * 3 + i) * 2;
          const col = c.kind === 'crystal' ? '#35E0FF' : c.kind === 'dark' ? '#B26BFF' : '#FFC83D';
          return (
            <G key={`c${i}`} transform={`translate(${c.x} ${c.y + bob})`}>
              <Circle r={c.kind === 'crystal' ? 15 : 20} fill={g(c.kind === 'crystal' ? 'gCyan' : c.kind === 'dark' ? 'gViolet' : 'gGold')} />
              <Polygon points="0,-9 6,0 0,9 -6,0" fill={col} stroke="#FFFFFF" strokeWidth={1} />
              {c.kind === 'dark' && <Circle r={13} fill="none" stroke="#FF8A2A" strokeWidth={1.2} strokeDasharray="3 4" />}
            </G>
          );
        })}

        {s.mines.map((m, i) => !m.gone && vis(m.x) && (
          <G key={`m${i}`} transform={`translate(${m.x} ${m.y})`}>
            <Circle r={m.s.trigger} fill="none" stroke="#FF3B5C" strokeOpacity={m.armed ? 0.5 : 0.12} strokeWidth={1} strokeDasharray="4 6" />
            {m.armed && <Circle r={m.s.blast} fill={g('gRed')} opacity={0.6} />}
            <Circle r={9} fill="#2A0F12" stroke="#FF3B5C" strokeWidth={2} />
            {[0, 45, 90, 135].map((a) => <Line key={a} x1={-14} y1={0} x2={14} y2={0} stroke="#FF3B5C" strokeWidth={2} transform={`rotate(${a})`} />)}
            <Circle r={3} fill={m.armed && Math.floor(clk * 10) % 2 ? '#FFFFFF' : '#FF3B5C'} />
          </G>
        ))}

        {s.beams.map((b, i) => {
          if (!vis((b.x1 + b.x2) / 2, 400)) return null;
          const bar = b.s.kind === 'barrier';
          const col = bar ? '#3DA5FF' : '#FF3B5C';
          if (!b.on)
            return <Line key={`b${i}`} x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke={col} strokeOpacity={b.warn ? 0.9 : 0.16} strokeWidth={b.warn ? 2.5 : 1.5} strokeDasharray="4 8" />;
          return (
            <G key={`b${i}`}>
              <Line x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke={col} strokeOpacity={0.28} strokeWidth={bar ? 20 : 12} strokeLinecap="round" />
              <Line x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke={col} strokeWidth={bar ? 9 : 3.5} strokeDasharray={bar ? '16 4' : undefined} strokeLinecap="round" />
              <Line x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke={bar ? '#FFB02E' : '#FFFFFF'} strokeWidth={bar ? 2.5 : 1.2} strokeDasharray={bar ? '16 4' : undefined} />
              <Circle cx={b.x1} cy={b.y1} r={5} fill="#101030" stroke={col} strokeWidth={2} />
              <Circle cx={b.x2} cy={b.y2} r={5} fill="#101030" stroke={col} strokeWidth={2} />
            </G>
          );
        })}

        {s.rocks.map((r, i) => !r.gone && vis(r.x, r.r + 20) && (
          <G key={`r${i}`} transform={`translate(${r.x} ${r.y})`} opacity={r.alpha}>
            {r.hot && <Circle r={r.r * 2.2} fill={g('gOrange')} />}
            <G transform={`rotate(${r.rot})`}>
              <Polygon points={r.shape} fill={r.hot ? '#3A140E' : '#2B2146'} stroke={r.hot ? '#FF7A2A' : '#8C7BC0'} strokeWidth={2} />
            </G>
            {s.rocks[i].s.motion?.type === 'chase' && <Circle r={r.r + 5} fill="none" stroke="#FF3B5C" strokeWidth={1.5} strokeDasharray="3 4" />}
          </G>
        ))}

        <G transform={`translate(${ex.x} ${ex.y})`}>
          <Circle r={EXIT_R * 2.2} fill={g(unlocked ? 'gCyan' : 'gRed')} />
          <G transform={`rotate(${clk * 50})`}>
            <Circle r={EXIT_R} fill="none" stroke={ec} strokeWidth={3.5} strokeDasharray="14 8" />
          </G>
          <G transform={`rotate(${-clk * 80})`}>
            <Circle r={EXIT_R * 0.7} fill="none" stroke={ec} strokeWidth={2.5} strokeDasharray="8 8" />
          </G>
          <Circle r={EXIT_R * 0.38} fill="#031024" stroke="#FFFFFF" strokeOpacity={0.8} strokeWidth={1.5} />
          {!unlocked && <SvgText x={0} y={5} fill="#FFFFFF" fontSize={11} fontWeight="bold" textAnchor="middle">{lvl.minOrbits && s.orbitTravel < lvl.minOrbits * Math.PI * 2 ? 'ÓRBITA' : `${s.crystals}/${lvl.minCrystals}`}</SvgText>}
          <Polyline points="-58,-12 -48,0 -58,12" fill="none" stroke={ec} strokeWidth={3} />
          <Polyline points="-70,-12 -60,0 -70,12" fill="none" stroke={ec} strokeOpacity={0.5} strokeWidth={3} />
        </G>

        {chunks}
        {s.center && alive && <Line x1={p.x} y1={p.y} x2={s.center.x} y2={s.center.y} stroke={accent} strokeOpacity={s.thrust > 0.1 ? 0.3 : 0.12} strokeWidth={1} strokeDasharray="2 6" />}
        {s.magnetT > 0 && <Circle cx={p.x} cy={p.y} r={MAGNET_R} fill="none" stroke="#FF4F6D" strokeOpacity={0.2} strokeWidth={1.5} strokeDasharray="6 8" />}

        {(s.mode === 'play' || s.mode === 'won') && !blink && (
          <G transform={`translate(${p.x} ${p.y}) rotate(${Math.atan2(p.vy, p.vx) * 180 / Math.PI}) scale(${s.mode === 'won' ? Math.max(0.2, 1 - s.wonT * 1.2) : 1})`}>
            <Circle r={18} fill={`url(#${uid}skin)`} />
            <Circle r={7 + Math.min(3, Math.hypot(p.vx, p.vy) / 120)} fill="none" stroke={skinGlow} strokeOpacity={0.22} strokeWidth={2} transform={`scale(${1 + Math.min(0.8, Math.hypot(p.vx, p.vy) / 500)} 0.72)`} />
            {s.thrust > 0.1 && (
              <>
                <Line x1={0} y1={0} x2={-s.thrustDir.x * 26 * s.thrust} y2={-s.thrustDir.y * 26 * s.thrust} stroke={skinGlow} strokeWidth={4} strokeLinecap="round" strokeOpacity={0.8} />
                <Circle r={11 + 4 * s.thrust} fill="none" stroke="#FFFFFF" strokeOpacity={0.5 * s.thrust} strokeWidth={1.5} />
              </>
            )}
            {skin.shape === 'ring' ? (
              <>
                <Circle r={6.5} fill="none" stroke={skinGlow} strokeWidth={3} />
                <Circle r={2.4} fill="#FFFFFF" />
              </>
            ) : skin.shape === 'diamond' ? (
              <Polygon points="0,-8 6,0 0,8 -6,0" fill={skin.colors[0]} stroke={skinGlow} strokeWidth={2} />
            ) : (
              <Circle r={5.5} fill={skin.colors[0]} stroke={skinGlow} strokeWidth={2} />
            )}
            {s.shield && (
              <G transform={`rotate(${clk * 60})`}>
                <Circle r={15} fill="none" stroke={shieldColor} strokeWidth={2.5} strokeDasharray="10 5" />
                <Circle r={18} fill="none" stroke={shieldColor} strokeOpacity={0.35} strokeWidth={1.5} />
              </G>
            )}
          </G>
        )}

        {s.rings.map((r, i) => <Circle key={`g${i}`} cx={r.x} cy={r.y} r={r.r} fill="none" stroke={r.color} strokeWidth={2.5} strokeOpacity={Math.max(0, r.life / r.life0)} />)}
        {s.parts.map((q, i) => <Circle key={`q${i}`} cx={q.x} cy={q.y} r={Math.max(0.3, q.size * (q.life / q.max))} fill={q.color} opacity={Math.min(1, q.life / q.max + 0.2)} />)}
        {s.floaters.map((f, i) => <SvgText key={`f${i}`} x={f.x} y={f.y} fill={f.color} fontSize={13} fontWeight="bold" textAnchor="middle" opacity={Math.min(1, f.life * 1.5)}>{f.text}</SvgText>)}
      </G>
    </Svg>
  );
}
