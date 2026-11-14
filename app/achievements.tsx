import React from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/ui';
import { GoalCard } from '@/components/Goals';
import { ACHIEVEMENTS } from '@/game/catalog';

export default function Achievements() {
  return (
    <Screen title="Logros">
      <View style={{ gap: 10 }}>{ACHIEVEMENTS.map((g) => <GoalCard key={g.id} g={g} />)}</View>
    </Screen>
  );
}