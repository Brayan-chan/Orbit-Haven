import React from 'react';
import { Text, View } from 'react-native';
import { C, F } from '@/constants/theme';
import { Panel, Screen } from '@/components/ui';
import { WORLDS } from '@/game/catalog';
import { WORLD_LEVELS } from '@/game/levels';
import { metric, useGame, worldStars } from '@/store/GameStore';

export default function Stats() {
  const { save } = useGame();
  const m = (k: string) => String(Math.round(metric(save, k)));
  const tiles: [string, string][] = [
    ['Niveles completados', `${m('levelsDone')}/25`],
    ['Estrellas', `${m('stars')}/75`],
    ['Puntuación acumulada', m('totalScore')],
    ['Cristales recogidos', m('crystals')],
    ['Materia oscura', m('dark')],
    ['Rutas secretas', m('secrets')],
    ['Rozones', m('nearMiss')],
    ['Distancia', `${m('distance')} u`],
    ['Habilidades usadas', m('abilities')],
    ['Vidas perdidas', m('deaths')],
    ['Partidas', m('runs')],
    ['Tiempo de juego', `${Math.round((save.stats.playTime ?? 0) / 60)} min`],
  ];
  return (
    <Screen title="Estadísticas">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {tiles.map(([k, v]) => (
          <Panel key={k} style={{ width: '48%', padding: 12 }}>
            <Text style={{ color: C.dim, fontFamily: F.bold, fontSize: 10, letterSpacing: 1 }}>{k.toUpperCase()}</Text>
            <Text style={{ color: C.text, fontFamily: F.italic, fontSize: 22 }}>{v}</Text>
          </Panel>
        ))}
      </View>
      <Text style={{ color: C.cyan, fontFamily: F.bold, fontSize: 12, letterSpacing: 1.5, marginVertical: 14 }}>RÉCORDS POR MUNDO</Text>
      <View style={{ gap: 8 }}>
        {WORLDS.map((w) => {
          const best = WORLD_LEVELS[w.id - 1].reduce((a, l) => a + (save.levels[l.id]?.best ?? 0), 0);
          return (
            <Panel key={w.id} accent={w.pal.accent} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 14 }}>{w.name}</Text>
              <Text style={{ color: C.dim, fontFamily: F.semi, fontSize: 13 }}>{worldStars(save, w.id)}★ · {best} pts</Text>
            </Panel>
          );
        })}
      </View>
    </Screen>
  );
}