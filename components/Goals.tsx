import React from 'react';
import { Text, View } from 'react-native';
import { Coins, Gem } from 'lucide-react-native';
import { C, F } from '@/constants/theme';
import { Bar, GlowButton, Panel } from '@/components/ui';
import type { Goal } from '@/game/catalog';
import { metric, useGame } from '@/store/GameStore';
import { sfx } from '@/lib/audio';

export function GoalCard({ g }: { g: Goal }) {
  const { save, claim } = useGame();
  const daily = g.kind === 'daily';
  const val = Math.min(g.target, metric(save, g.metric, daily));
  const done = daily ? save.daily.claimed.includes(g.id) : save.claimed.includes(g.id);
  const ready = val >= g.target && !done;
  return (
    <Panel accent={ready ? C.gold : C.lineSoft} style={{ gap: 6, opacity: done ? 0.6 : 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 16 }}>{g.title}</Text>
          <Text style={{ color: C.dim, fontFamily: F.regular, fontSize: 12 }}>{g.desc}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <Coins size={13} color={C.gold} />
            <Text style={{ color: C.gold, fontFamily: F.bold, fontSize: 13 }}>{g.coins}</Text>
          </View>
          {!!g.crystals && (
            <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              <Gem size={13} color={C.cyan} />
              <Text style={{ color: C.cyan, fontFamily: F.bold, fontSize: 13 }}>{g.crystals}</Text>
            </View>
          )}
        </View>
      </View>
      <Bar value={val / g.target} color={ready || done ? C.gold : C.cyan} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: C.dim, fontFamily: F.semi, fontSize: 12 }}>{Math.floor(val)}/{g.target}</Text>
        {done ? <Text style={{ color: C.green, fontFamily: F.bold, fontSize: 12 }}>RECLAMADO</Text> : <GlowButton small variant="gold" disabled={!ready} label="Reclamar" onPress={() => { claim(g); sfx('buy'); }} style={{ minWidth: 120 }} />}
      </View>
    </Panel>
  );
}
