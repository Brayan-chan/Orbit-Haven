import React, { memo, useId, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient as SvgGrad, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Coins, Gem } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { C, F, glow } from '@/constants/theme';
import { ITEM_MAP, Palette, WORLDS } from '@/game/catalog';
import { useGame } from '@/store/GameStore';
import { sfx } from '@/lib/audio';

function mulberry(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const StarLayer = memo(function StarLayer({ w, h, n, seed, tint }: { w: number; h: number; n: number; seed: number; tint: string }) {
  const stars = useMemo(() => {
    const r = mulberry(seed);
    return Array.from({ length: n }, () => ({ x: r() * w, y: r() * h, r: 0.5 + r() * 1.3, o: 0.3 + r() * 0.7, c: r() > 0.85 ? tint : '#FFFFFF' }));
  }, [w, h, n, seed, tint]);
  return (
    <>
      {stars.map((s, i) => (
        <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.c} opacity={s.o} />
      ))}
    </>
  );
});

export function usePalette(world?: number): Palette {
  const { save } = useGame();
  const th = ITEM_MAP[save.equipped.theme];
  if (th?.pal) return th.pal;
  return WORLDS[(world ?? 1) - 1].pal;
}

export function SpaceBackdrop({ palette, stars = true }: { palette?: Palette; stars?: boolean }) {
  const { width, height } = useWindowDimensions();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const base = usePalette(1);
  const p = palette ?? base;
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <SvgGrad id={`${uid}bg`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={p.bg[0]} />
          <Stop offset="1" stopColor={p.bg[1]} />
        </SvgGrad>
        {p.nebula.map((c, i) => (
          <RadialGradient key={i} id={`${uid}n${i}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={c} stopOpacity="0.5" />
            <Stop offset="1" stopColor={c} stopOpacity="0" />
          </RadialGradient>
        ))}
      </Defs>
      <Rect width={width} height={height} fill={`url(#${uid}bg)`} />
      <Ellipse cx={width * 0.15} cy={height * 0.2} rx={width * 0.8} ry={height * 0.32} fill={`url(#${uid}n0)`} />
      <Ellipse cx={width * 0.9} cy={height * 0.55} rx={width * 0.7} ry={height * 0.3} fill={`url(#${uid}n1)`} />
      <Ellipse cx={width * 0.3} cy={height * 0.95} rx={width * 0.8} ry={height * 0.25} fill={`url(#${uid}n2)`} />
      {stars && <StarLayer w={width} h={height} n={70} seed={11} tint={p.accent} />}
    </Svg>
  );
}

export function Currency() {
  const { save } = useGame();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      <View style={[st.chip, { borderColor: 'rgba(53,224,255,0.45)' }]}>
        <Gem size={14} color={C.cyan} />
        <Text style={st.chipT}>{save.crystals}</Text>
      </View>
      <View style={[st.chip, { borderColor: 'rgba(255,200,61,0.45)' }]}>
        <Coins size={14} color={C.gold} />
        <Text style={st.chipT}>{save.coins}</Text>
      </View>
    </View>
  );
}

export function Screen({ title, back = true, children, scroll = true, world }: { title: string; back?: boolean; children: React.ReactNode; scroll?: boolean; world?: number }) {
  const router = useRouter();
  const pal = usePalette(world);
  const head = (
    <View style={st.head}>
      {back && (
        <Pressable
          accessibilityLabel="Volver"
          onPress={() => {
            sfx('ui');
            if (router.canGoBack()) router.back();
            else router.replace('/');
          }}
          style={st.back}>
          <ArrowLeft size={20} color={C.text} />
        </Pressable>
      )}
      <Text style={st.title} numberOfLines={1}>
        {title}
      </Text>
      <Currency />
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SpaceBackdrop palette={pal} />
      <SafeAreaView style={{ flex: 1 }}>
        {scroll ? (
          <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
            {head}
            {children}
          </ScrollView>
        ) : (
          <View style={st.content}>
            {head}
            {children}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

export function Panel({ children, style, accent = C.line }: { children: React.ReactNode; style?: ViewStyle; accent?: string }) {
  return <View style={[st.panel, { borderColor: accent }, style]}>{children}</View>;
}

export function GlowButton({ label, onPress, icon, variant = 'outline', disabled, style, small }: { label: string; onPress: () => void; icon?: React.ReactNode; variant?: 'primary' | 'outline' | 'gold' | 'danger'; disabled?: boolean; style?: ViewStyle; small?: boolean }) {
  const colors: [string, string] = variant === 'primary' ? ['#8A4DFF', '#4B1FD6'] : variant === 'gold' ? ['#FFD25C', '#F0912A'] : variant === 'danger' ? ['#FF5A7A', '#C21E48'] : ['rgba(12,22,68,0.85)', 'rgba(8,14,44,0.85)'];
  const dark = variant === 'gold';
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        sfx('ui');
        onPress();
      }}
      style={({ pressed }) => [{ opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[st.btn, small && { paddingVertical: 9 }, variant === 'outline' ? { borderColor: C.line } : { borderColor: 'rgba(255,255,255,0.35)' }, variant === 'primary' && glow(C.violet, 16, 0.6)]}>
        {icon}
        <Text style={[st.btnT, small && { fontSize: 14 }, dark && { color: '#2A1600' }]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function Bar({ value, color = C.cyan }: { value: number; color?: string }) {
  return (
    <View style={st.barBg}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%', backgroundColor: color, borderRadius: 4 }} />
    </View>
  );
}

const st = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, width: '100%', maxWidth: 560, alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  back: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: C.line, backgroundColor: 'rgba(8,14,44,0.8)', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: C.text, fontFamily: F.italic, fontSize: 22 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, backgroundColor: 'rgba(6,10,34,0.8)' },
  chipT: { color: C.text, fontFamily: F.bold, fontSize: 14 },
  panel: { borderWidth: 1.2, borderRadius: 18, backgroundColor: C.panel, padding: 14 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 16, borderWidth: 1.4 },
  btnT: { color: C.text, fontFamily: F.bold, fontSize: 17 },
  barBg: { height: 7, borderRadius: 4, backgroundColor: 'rgba(143,163,214,0.2)', overflow: 'hidden' },
});
