import React, { useState } from 'react';
import { Modal, Pressable, Switch, Text, View } from 'react-native';
import { C, F } from '@/constants/theme';
import { GlowButton, Panel, Screen } from '@/components/ui';
import { useGame } from '@/store/GameStore';
import { haptic, sfx, unlockAudio } from '@/lib/audio';

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ color: C.text, fontFamily: F.semi, fontSize: 15 }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: C.violet, false: '#1A2352' }} thumbColor={value ? C.cyan : '#7A88B8'} />
    </View>
  );
}
function Vol({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ paddingVertical: 6 }}>
      <Text style={{ color: C.dim, fontFamily: F.semi, fontSize: 12, marginBottom: 6 }}>{label} · {Math.round(value * 100)}%</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => (
          <Pressable key={v} onPress={() => onChange(v)} style={{ flex: 1, height: 28, borderRadius: 8, backgroundColor: value >= v && v > 0 ? C.cyan : 'rgba(143,163,214,0.2)' }} />
        ))}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { save, setSetting, reset } = useGame();
  const s = save.settings;
  const [confirm, setConfirm] = useState(false);
  return (
    <Screen title="Configuración">
      <Panel style={{ gap: 4 }}>
        <Row label="Música ambiental" value={s.music} onChange={(v) => { unlockAudio(); setSetting({ music: v }); }} />
        <Vol label="Volumen de música" value={s.musicVol} onChange={(v) => setSetting({ musicVol: v })} />
        <Row label="Efectos de sonido" value={s.sfx} onChange={(v) => { unlockAudio(); setSetting({ sfx: v }); }} />
        <Vol label="Volumen de efectos" value={s.sfxVol} onChange={(v) => { setSetting({ sfxVol: v }); unlockAudio(); sfx('crystal'); }} />
        <Row label="Vibración háptica" value={s.haptics} onChange={(v) => { setSetting({ haptics: v }); if (v) haptic('medium'); }} />
        <Row label="Efectos reducidos (más rendimiento)" value={s.reducedFx} onChange={(v) => setSetting({ reducedFx: v })} />
      </Panel>
      <Text style={{ color: C.dim, fontFamily: F.regular, fontSize: 12, marginVertical: 12 }}>
        Tu progreso se guarda en este dispositivo con copia de seguridad automática. El juego funciona sin conexión.
      </Text>
      <GlowButton variant="danger" label="Borrar progreso" onPress={() => setConfirm(true)} />
      <Modal transparent visible={confirm} animationType="fade" onRequestClose={() => setConfirm(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,4,16,0.8)', justifyContent: 'center', padding: 24 }}>
          <Panel style={{ maxWidth: 380, width: '100%', alignSelf: 'center', gap: 10, backgroundColor: '#0A1034' }}>
            <Text style={{ color: C.text, fontFamily: F.italic, fontSize: 20 }}>¿Borrar todo el progreso?</Text>
            <Text style={{ color: C.dim, fontFamily: F.semi, fontSize: 13 }}>Se perderán niveles, estrellas, compras y monedas. No se puede deshacer.</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <GlowButton style={{ flex: 1 }} small label="Cancelar" onPress={() => setConfirm(false)} />
              <GlowButton style={{ flex: 1 }} small variant="danger" label="Borrar" onPress={() => { reset(); setConfirm(false); }} />
            </View>
          </Panel>
        </View>
      </Modal>
    </Screen>
  );
}