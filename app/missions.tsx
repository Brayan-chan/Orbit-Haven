import React from 'react';
import { Text, View } from 'react-native';
import { C, F } from '@/constants/theme';
import { Screen } from '@/components/ui';
import { GoalCard } from '@/components/Goals';
import { SPECIALS } from '@/game/catalog';
import { dailyGoals, useGame } from '@/store/GameStore';

export default function Missions() {
  const { save } = useGame();
  const h = 24 - new Date().getHours();
  return (
    <Screen title="Misiones">
      <Text style={{ color: C.cyan, fontFamily: F.bold, fontSize: 12, letterSpacing: 1.5, marginBottom: 8 }}>MISIONES DIARIAS · SE RENUEVAN EN ~{h} H</Text>
      <View style={{ gap: 10 }}>{dailyGoals(save).map((g) => <GoalCard key={g.id} g={g} />)}</View>
      <Text style={{ color: C.gold, fontFamily: F.bold, fontSize: 12, letterSpacing: 1.5, marginVertical: 14 }}>DESAFÍOS ESPECIALES</Text>
      <View style={{ gap: 10 }}>{SPECIALS.map((g) => <GoalCard key={g.id} g={g} />)}</View>
    </Screen>
  );
}