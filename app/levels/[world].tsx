import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Lock, Play, Star } from 'lucide-react-native';
import { C, F, glow } from '@/constants/theme';
import { GlowButton, Panel, Screen } from '@/components/ui';
import { WORLDS } from '@/game/catalog';
import { WORLD_LEVELS } from '@/game/levels';
import type { LevelSpec } from '@/game/types';
import { isUnlocked, useGame } from '@/store/GameStore';
import { sfx } from '@/lib/audio';

export default function Levels() {
  const { world } = useLocalSearchParams<{ world: string }>();
  const wi = Math.min(5, Math.max(1, Number(world) || 1));
  const w = WORLDS[wi - 1];
  const router = useRouter();
  const { save } = useGame();
  const [sel, setSel] = useState<LevelSpec | null>(null);
  const rec = sel ? save.levels[sel.id] : undefined;
  return (
    <Screen title={w.name} world={wi}>
      <Text style={{ color: w.pal.accent, fontFamily: F.bold, fontSize: 12, letterSpacing: 1.5, marginBottom: 10 }}>{w.tag.toUpperCase()} · {w.desc}</Text>
      <View style={{ gap: 10 }}>
        {WORLD_LEVELS[wi - 1].map((l) => {
          const open = isUnlocked(save, l.id);
          const r = save.levels[l.id];
          return (
            <Pressable key={l.id} disabled={!open} onPress={() => { sfx('ui'); setSel(l); }}>
              <Panel accent={open ? w.pal.accent : C.lineSoft} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: open ? 1 : 0.5, paddingVertical: 12 }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: open ? w.pal.accent : C.faint, alignItems: 'center', justifyContent: 'center', ...(open ? glow(w.pal.accent, 8, 0.5) : {}) }}>
                  {open ? <Text style={{ color: C.text, fontFamily: F.black, fontSize: 15 }}>{l.id}</Text> : <Lock size={18} color={C.dim} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 16 }}>{l.name}</Text>
                  <Text style={{ color: C.dim, fontFamily: F.regular, fontSize: 12 }}>{l.subtitle}{l.zones.length > 1 ? ` · ${l.zones.length} zonas` : ''}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {[1, 2, 3].map((n) => <Star key={n} size={16} color={C.gold} fill={(r?.stars ?? 0) >= n ? C.gold : 'transparent'} />)}
                  </View>
                  {!!r?.best && <Text style={{ color: C.dim, fontFamily: F.semi, fontSize: 11 }}>Récord {r.best}</Text>}
                </View>
              </Panel>
            </Pressable>
          );
        })}
      </View>
      <Modal transparent visible={!!sel} animationType="fade" onRequestClose={() => setSel(null)}>
        <Pressable onPress={() => setSel(null)} style={{ flex: 1, backgroundColor: 'rgba(2,4,16,0.8)', justifyContent: 'center', padding: 20 }}>
          {sel && (
            <Pressable>
              <Panel accent={w.pal.accent} style={{ gap: 8, maxWidth: 460, width: '100%', alignSelf: 'center', backgroundColor: '#0A1034' }}>
                <Text style={{ color: w.pal.accent, fontFamily: F.bold, fontSize: 12, letterSpacing: 2 }}>NIVEL {sel.id}</Text>
                <Text style={{ color: C.text, fontFamily: F.italic, fontSize: 24 }}>{sel.name}</Text>
                <Text style={{ color: C.dim, fontFamily: F.semi, fontSize: 13 }}>{sel.subtitle}</Text>
                <View style={{ gap: 5, marginVertical: 6 }}>
                  {[
                    ['1', sel.minCrystals ? `Llega al portal con ${sel.minCrystals} cristales` : 'Llega al portal de salida'],
                    ['2', 'Recoge al menos el 75% de los cristales'],
                    ['3', 'Todos los cristales y máximo 1 vida perdida'],
                  ].map(([n, t]) => (
                    <View key={n} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <Star size={15} color={C.gold} fill={(rec?.stars ?? 0) >= Number(n) ? C.gold : 'transparent'} />
                      <Text style={{ color: C.text, fontFamily: F.regular, fontSize: 13, flex: 1 }}>{t}</Text>
                    </View>
                  ))}
                </View>
                {!!rec?.best && <Text style={{ color: C.dim, fontFamily: F.semi, fontSize: 12 }}>Récord personal: {rec.best} · Mejor tiempo: {rec.bestTime}s</Text>}
                <GlowButton variant="primary" label="Jugar" icon={<Play size={18} color={C.text} fill={C.text} />} onPress={() => { const id = sel.id; setSel(null); router.push(`/play/${id}` as any); }} />
              </Panel>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </Screen>
  );
}