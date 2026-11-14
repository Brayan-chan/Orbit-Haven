import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
import { Check, Gem, Coins, Lock } from 'lucide-react-native';
import { C, F } from '@/constants/theme';
import { GlowButton, Panel, Screen } from '@/components/ui';
import { ABILITY_LIST, CATS, CAT_LABEL, ITEMS, Item, LIFE_PRICES, SHIELD_START_PRICE, UPGRADE_PRICES, Cat } from '@/game/catalog';
import { abilityUnlocked, useGame } from '@/store/GameStore';
import { sfx } from '@/lib/audio';

function Preview({ it }: { it: Item }) {
  const c = it.colors;
  return (
    <Svg width={64} height={64} viewBox="-32 -32 64 64">
      {it.cat === 'trail' ? (
        c.map((col, i) => <Line key={i} x1={-26 + i * 4} y1={14 - i * 8} x2={22} y2={-10 + i * 3} stroke={col} strokeWidth={6 - i * 1.5} strokeLinecap="round" strokeOpacity={0.85} />)
      ) : it.cat === 'particle' ? (
        <>
          <Circle r={22} fill={c[1]} opacity={0.25} />
          {it.shape === 'diamond' ? <Polygon points="0,-13 10,0 0,13 -10,0" fill={c[0]} stroke={c[1]} strokeWidth={3} /> : it.shape === 'ring' ? <Circle r={11} fill="none" stroke={c[1]} strokeWidth={5} /> : <Circle r={10} fill={c[0]} stroke={c[1]} strokeWidth={3} />}
        </>
      ) : it.cat === 'explosion' ? (
        Array.from({ length: 10 }).map((_, i) => <Circle key={i} cx={Math.cos(i * 0.63) * (10 + (i % 3) * 7)} cy={Math.sin(i * 0.63) * (10 + (i % 3) * 7)} r={3} fill={c[i % c.length]} />)
      ) : it.cat === 'shield' ? (
        <Circle r={20} fill="none" stroke={c[0]} strokeWidth={4} strokeDasharray="10 5" />
      ) : it.cat === 'teleport' ? (
        Array.from({ length: it.count ?? 2 }).map((_, i) => <Circle key={i} r={8 + i * 7} fill="none" stroke={c[0]} strokeWidth={2.5} strokeOpacity={1 - i * 0.2} />)
      ) : (
        <>
          <Circle r={26} fill={c[0]} opacity={0.5} />
          <Circle cx={8} cy={6} r={16} fill={c[1]} opacity={0.5} />
        </>
      )}
    </Svg>
  );
}

export default function Shop() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { save, buy, equip, buyUpgrade } = useGame();
  const [inv, setInv] = useState(tab === 'inv');
  const [cat, setCat] = useState<Cat | 'up'>(inv ? 'particle' : 'up');
  const [confirm, setConfirm] = useState<Item | null>(null);

  const tabs: (Cat | 'up')[] = inv ? CATS : ['up', ...CATS];
  const active = tabs.includes(cat) ? cat : tabs[0];
  const items = ITEMS.filter((i) => i.cat === active && (!inv || save.owned.includes(i.id)));

  return (
    <Screen title={inv ? 'Inventario' : 'Tienda'}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <GlowButton style={{ flex: 1 }} small variant={!inv ? 'primary' : 'outline'} label="Tienda" onPress={() => setInv(false)} />
        <GlowButton style={{ flex: 1 }} small variant={inv ? 'primary' : 'outline'} label="Inventario" onPress={() => { setInv(true); if (cat === 'up') setCat('particle'); }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8 }}>
        {tabs.map((t) => (
          <Pressable key={t} onPress={() => setCat(t)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, borderWidth: 1.3, borderColor: active === t ? C.cyan : C.lineSoft, backgroundColor: active === t ? 'rgba(53,224,255,0.14)' : 'rgba(6,12,40,0.7)' }}>
            <Text style={{ color: active === t ? C.cyan : C.dim, fontFamily: F.bold, fontSize: 13 }}>{t === 'up' ? 'Mejoras' : CAT_LABEL[t]}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {active === 'up' ? (
        <View style={{ gap: 10 }}>
          <Text style={{ color: C.dim, fontFamily: F.regular, fontSize: 12 }}>Las mejoras funcionales se compran con monedas, que se ganan jugando. Nada se vende por dinero real.</Text>
          {ABILITY_LIST.map((a) => {
            const lv = save.upgrades[a.id] ?? 0;
            const open = abilityUnlocked(save, a.id);
            return (
              <Panel key={a.id} accent={open ? a.color : C.lineSoft} style={{ opacity: open ? 1 : 0.6 }}>
                <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 16 }}>{a.name}</Text>
                <Text style={{ color: C.dim, fontFamily: F.regular, fontSize: 12 }}>{a.desc} Nv {lv}/3 · +25% {a.stat.toLowerCase()} por nivel · Nv2: +1 carga</Text>
                {open ? (
                  <GlowButton small variant="gold" disabled={lv >= 3 || save.coins < UPGRADE_PRICES[lv]} style={{ marginTop: 8 }} label={lv >= 3 ? 'Máximo' : `Mejorar · ${UPGRADE_PRICES[lv]} monedas`} onPress={() => { if (buyUpgrade(a.id)) sfx('buy'); }} />
                ) : (
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, alignItems: 'center' }}>
                    <Lock size={14} color={C.dim} />
                    <Text style={{ color: C.dim, fontFamily: F.semi, fontSize: 12 }}>Se desbloquea al completar {a.unlockAt} niveles</Text>
                  </View>
                )}
              </Panel>
            );
          })}
          {[
            { k: 'lives', n: 'Vidas extra', d: '+1 vida por nivel de mejora en cada partida.', max: 2, price: LIFE_PRICES },
            { k: 'startShield', n: 'Escudo inicial', d: 'Empiezas cada nivel con un escudo.', max: 1, price: [SHIELD_START_PRICE] },
          ].map((u) => {
            const lv = save.upgrades[u.k] ?? 0;
            return (
              <Panel key={u.k}>
                <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 16 }}>{u.n}</Text>
                <Text style={{ color: C.dim, fontFamily: F.regular, fontSize: 12 }}>{u.d} Nv {lv}/{u.max}</Text>
                <GlowButton small variant="gold" disabled={lv >= u.max || save.coins < u.price[lv]} style={{ marginTop: 8 }} label={lv >= u.max ? 'Máximo' : `Mejorar · ${u.price[lv]} monedas`} onPress={() => { if (buyUpgrade(u.k)) sfx('buy'); }} />
              </Panel>
            );
          })}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {items.map((it) => {
            const owned = save.owned.includes(it.id);
            const eq = save.equipped[it.cat] === it.id;
            return (
              <Panel key={it.id} accent={eq ? C.cyan : C.lineSoft} style={{ width: '48%', alignItems: 'center', gap: 6, padding: 10 }}>
                <Preview it={it} />
                <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 14, textAlign: 'center' }}>{it.name}</Text>
                {owned ? (
                  <GlowButton small style={{ alignSelf: 'stretch' }} variant={eq ? 'primary' : 'outline'} disabled={eq} label={eq ? 'Equipado' : 'Equipar'} icon={eq ? <Check size={15} color={C.text} /> : undefined} onPress={() => equip(it.id)} />
                ) : (
                  <GlowButton small style={{ alignSelf: 'stretch' }} variant="gold" label={`${it.price}`} icon={<Gem size={15} color="#2A1600" />} disabled={save.crystals < it.price} onPress={() => setConfirm(it)} />
                )}
              </Panel>
            );
          })}
          {inv && items.length === 0 && <Text style={{ color: C.dim, fontFamily: F.semi }}>Aún no tienes objetos de esta categoría.</Text>}
        </View>
      )}

      <Modal transparent visible={!!confirm} animationType="fade" onRequestClose={() => setConfirm(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,4,16,0.8)', justifyContent: 'center', padding: 24 }}>
          {confirm && (
            <Panel style={{ maxWidth: 380, width: '100%', alignSelf: 'center', alignItems: 'center', gap: 8, backgroundColor: '#0A1034' }}>
              <Preview it={confirm} />
              <Text style={{ color: C.text, fontFamily: F.italic, fontSize: 20 }}>{confirm.name}</Text>
              <Text style={{ color: C.dim, fontFamily: F.semi, fontSize: 13, textAlign: 'center' }}>¿Comprar por {confirm.price} cristales? Se equipará al instante.</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
                <GlowButton style={{ flex: 1 }} small label="Cancelar" onPress={() => setConfirm(null)} />
                <GlowButton style={{ flex: 1 }} small variant="gold" label="Comprar" onPress={() => { if (buy(confirm.id)) sfx('buy'); setConfirm(null); }} />
              </View>
            </Panel>
          )}
        </View>
      </Modal>
    </Screen>
  );
}