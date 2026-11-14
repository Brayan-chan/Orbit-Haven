import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Star } from 'lucide-react-native';
import { C, F, glow } from '@/constants/theme';
import { Bar, Panel, Screen } from '@/components/ui';
import { WORLDS } from '@/game/catalog';
import { WORLD_LEVELS } from '@/game/levels';
import { isUnlocked, useGame, worldDone, worldStars } from '@/store/GameStore';
import { sfx } from '@/lib/audio';

export default function Worlds() {
  const router = useRouter();
  const { save } = useGame();
  return (
    <Screen title="Mundos">
      <View style={{ gap: 14 }}>
        {WORLDS.map((w) => {
          const lv = WORLD_LEVELS[w.id - 1];
          const open = isUnlocked(save, lv[0].id);
          const stars = worldStars(save, w.id);
          const done = lv.filter((l) => (save.levels[l.id]?.stars ?? 0) > 0).length;
          return (
            <Pressable
              key={w.id}
              disabled={!open}
              onPress={() => {
                sfx('ui');
                router.push(`/levels/${w.id}` as any);
              }}>
              <Panel accent={open ? w.pal.accent : C.lineSoft} style={{ opacity: open ? 1 : 0.55, ...(open ? glow(w.pal.accent, 10, 0.3) : {}) }}>
                <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: w.pal.nebula[0], borderWidth: 3, borderColor: w.pal.nebula[2], alignItems: 'center', justifyContent: 'center', ...glow(w.pal.nebula[1], 14, 0.7) }}>
                    {open ? <Text style={{ color: '#fff', fontFamily: F.logo, fontSize: 26 }}>{w.id}</Text> : <Lock size={24} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: w.pal.accent, fontFamily: F.bold, fontSize: 11, letterSpacing: 1.5 }}>{w.tag.toUpperCase()}{worldDone(save, w.id) ? ' · COMPLETADO' : ''}</Text>
                    <Text style={{ color: C.text, fontFamily: F.italic, fontSize: 20 }}>{w.name}</Text>
                    <Text style={{ color: C.dim, fontFamily: F.regular, fontSize: 12, marginVertical: 3 }}>{w.desc}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Bar value={done / lv.length} color={w.pal.accent} />
                      </View>
                      <Star size={13} color={C.gold} fill={C.gold} />
                      <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 12 }}>{stars}/{lv.length * 3}</Text>
                    </View>
                  </View>
                </View>
                {!open && <Text style={{ color: C.dim, fontFamily: F.semi, fontSize: 12, marginTop: 8 }}>Completa el mundo anterior para desbloquear</Text>}
              </Panel>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}