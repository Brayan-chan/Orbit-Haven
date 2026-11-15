import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Defs, G, RadialGradient, Stop } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Backpack, ChartColumn, FlaskConical, Play, Settings, ShoppingCart, Smartphone, Star, Trophy } from 'lucide-react-native';
import { C, F } from '@/constants/theme';
import { Currency, GlowButton, SpaceBackdrop } from '@/components/ui';
import { ALL_LEVELS } from '@/game/levels';
import { dailyGoals, isUnlocked, metric, useGame } from '@/store/GameStore';

function Hero({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 0.7} viewBox="-150 -105 300 210">
      <Defs>
        <RadialGradient id="hg" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FF4FD8" stopOpacity="0.8" />
          <Stop offset="1" stopColor="#FF4FD8" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle r={120} fill="url(#hg)" />
      <G transform="scale(1 0.55) rotate(-18)">
        <Circle r={78} fill="none" stroke="#9B5CFF" strokeWidth={10} strokeOpacity={0.5} strokeDasharray="60 20" />
        <Circle r={62} fill="none" stroke="#FF4FD8" strokeWidth={8} strokeOpacity={0.8} strokeDasharray="40 14" />
        <Circle r={48} fill="none" stroke="#FF8A2A" strokeWidth={6} />
      </G>
      <Circle r={38} fill="#000" stroke="#FFC28A" strokeWidth={2.5} />
      <Circle cx={92} cy={-52} r={7} fill="#FFFFFF" />
      <Circle cx={92} cy={-52} r={16} fill="#FFFFFF" opacity={0.2} />
    </Svg>
  );
}

export default function Home() {
  const router = useRouter();
  const { save } = useGame();
  const { width } = useWindowDimensions();
  const cur = ALL_LEVELS.find((l) => isUnlocked(save, l.id) && !(save.levels[l.id]?.stars > 0)) ?? ALL_LEVELS[ALL_LEVELS.length - 1];
  const claimable = dailyGoals(save).filter((g) => !save.daily.claimed.includes(g.id) && metric(save, g.metric, true) >= g.target).length;
  const go = (p: string) => router.push(p as any);
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SpaceBackdrop />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={st.wrap}>
          <View style={{ alignItems: 'flex-end' }}>
            <Currency />
          </View>
          <View style={{ alignItems: 'center', marginTop: 4 }}>
            <Hero size={Math.min(width - 40, 330)} />
            <Text style={[st.logo, { color: '#F4F8FF', textShadowColor: C.cyan }]}>ORBIT</Text>
            <Text style={[st.logo, { color: '#B26BFF', textShadowColor: C.violet, marginTop: -10 }]}>HAVEN</Text>
          </View>
          <View style={{ gap: 10, marginTop: 18 }}>
            <GlowButton variant="primary" label={save.stats.runs ? `Jugar · Nivel ${cur.id}` : 'Jugar'} icon={<Play size={20} color={C.text} fill={C.text} />} onPress={() => go('/worlds')} />
            <GlowButton label="Laboratorio de físicas" icon={<FlaskConical size={19} color={C.cyan} />} onPress={() => go('/lab')} />
            <GlowButton label="Tienda" icon={<ShoppingCart size={19} color={C.cyan} />} onPress={() => go('/shop')} />
            <GlowButton label={claimable ? `Misiones · ${claimable} por reclamar` : 'Misiones'} icon={<Star size={19} color={C.gold} fill={C.gold} />} onPress={() => go('/missions')} />
            <GlowButton label="Logros" icon={<Trophy size={19} color={C.gold} />} onPress={() => go('/achievements')} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <GlowButton style={{ flex: 1 }} small label="Inventario" icon={<Backpack size={17} color={C.cyan} />} onPress={() => go('/shop?tab=inv')} />
              <GlowButton style={{ flex: 1 }} small label="Estadísticas" icon={<ChartColumn size={17} color={C.cyan} />} onPress={() => go('/stats')} />
            </View>
            <GlowButton label="Configuración" icon={<Settings size={19} color={C.cyan} />} onPress={() => go('/settings')} />
          </View>
          <View style={st.rot}>
            <Smartphone size={26} color={C.cyan} />
            <Text style={st.rotT}>Gira tu dispositivo para jugar</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, padding: 18, width: '100%', maxWidth: 460, alignSelf: 'center', justifyContent: 'center' },
  logo: { fontFamily: F.logo, fontSize: 62, lineHeight: 64, textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 } },
  rot: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: C.lineSoft, backgroundColor: 'rgba(6,12,40,0.7)' },
  rotT: { color: C.dim, fontFamily: F.semi, fontSize: 14 },
});
