import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import OfflineBanner from '../components/OfflineBanner';
import client from '../api/client';
import { colors, radius, colorForFiliere } from '../theme';

// Centre de contrôle (Admin, mobile) : classes par filière + désigner/révoquer
// le délégué en choisissant parmi les élèves de la classe.
export default function AdminControlScreen() {
  const [classes, setClasses] = useState([]);
  const [candidats, setCandidats] = useState([]);
  const [filtre, setFiltre] = useState(null);
  const [open, setOpen] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/admin/classes');
      setClasses(data.classes || []);
      setCandidats(data.candidats || []);
    } catch (_) { Alert.alert('Erreur', 'Chargement impossible (connexion ?).'); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function designate(niveauId, userId, name) {
    try {
      await client.post(`/admin/classes/${niveauId}/delegue`, { user_id: userId });
      await load();
      Alert.alert('Délégué désigné', `${name} est désormais délégué de la classe.`);
    } catch (e) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Action impossible.');
    }
  }

  function confirmRevoke(niveauId, userId, name) {
    Alert.alert('Révoquer', `Retirer le titre de délégué à ${name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Révoquer', style: 'destructive',
        onPress: async () => {
          try { await client.delete(`/admin/classes/${niveauId}/delegue/${userId}`); await load(); }
          catch (_) { Alert.alert('Erreur', 'Action impossible.'); }
        },
      },
    ]);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>;

  const filieres = [...new Map(classes.filter((c) => c.filiere).map((c) => [c.filiere.code, c.filiere])).values()];
  const shown = filtre ? classes.filter((c) => c.filiere?.code === filtre) : classes;

  return (
    <View style={styles.flex}>
      <OfflineBanner />

      {/* Filtre par filière */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsWrap}
                  contentContainerStyle={styles.chips}>
        <Chip label="Toutes" active={!filtre} color={colors.red} onPress={() => setFiltre(null)} />
        {filieres.map((f) => (
          <Chip key={f.code} label={f.code} active={filtre === f.code}
                color={f.couleur || colorForFiliere(f.code)} onPress={() => setFiltre(f.code)} />
        ))}
      </ScrollView>

      <FlatList
        data={shown}
        keyExtractor={(c) => String(c.niveau_id)}
        contentContainerStyle={{ padding: 14, paddingTop: 4 }}
        renderItem={({ item }) => {
          const current = item.delegues?.[0];
          const eleves = candidats.filter((u) => String(u.niveau_id) === String(item.niveau_id));
          const isOpen = !!open[item.niveau_id];
          const accent = item.filiere?.couleur || colorForFiliere(item.filiere?.code);
          return (
            <View style={styles.card}>
              <TouchableOpacity style={styles.cardHead}
                onPress={() => setOpen((o) => ({ ...o, [item.niveau_id]: !o[item.niveau_id] }))}>
                <View style={[styles.badge, { backgroundColor: accent }]}>
                  <Text style={styles.badgeText}>{item.filiere?.code}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.classTitle}>{item.filiere?.code} · {item.niveau}</Text>
                  <Text style={styles.delegInfo}>
                    {current ? `Délégué : ${current.name}` : 'Aucun délégué'}
                  </Text>
                </View>
                <Text style={styles.chevron}>{isOpen ? '▲' : `▼ ${eleves.length}`}</Text>
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.students}>
                  {eleves.length === 0 ? (
                    <Text style={styles.muted}>Aucun élève dans cette classe.</Text>
                  ) : eleves.map((u) => {
                    const isDeleg = current && current.id === u.id;
                    return (
                      <View key={u.id} style={styles.studentRow}>
                        <Text style={styles.studentName} numberOfLines={1}>
                          {u.name}{isDeleg ? '  ⭐' : ''}
                        </Text>
                        {isDeleg ? (
                          <TouchableOpacity style={styles.btnRevoke}
                            onPress={() => confirmRevoke(item.niveau_id, u.id, u.name)}>
                            <Text style={styles.btnRevokeText}>Révoquer</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity style={styles.btnDesignate}
                            onPress={() => designate(item.niveau_id, u.id, u.name)}>
                            <Text style={styles.btnDesignateText}>Désigner</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.muted}>Aucune classe.</Text>}
      />
    </View>
  );
}

function Chip({ label, active, color, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}
      style={[styles.chip, { borderColor: color }, active && { backgroundColor: color }]}>
      <Text style={[styles.chipText, { color: active ? '#fff' : color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chipsWrap: { maxHeight: 52, flexGrow: 0 },
  chips: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  chipText: { fontWeight: '700', fontSize: 12 },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: 10, overflow: 'hidden' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  classTitle: { fontWeight: '800', color: colors.navy, fontSize: 15 },
  delegInfo: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  chevron: { color: colors.textMuted, fontWeight: '700' },
  students: { borderTopWidth: 1, borderTopColor: colors.border, padding: 10, gap: 6 },
  studentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 4 },
  studentName: { flex: 1, color: colors.text },
  btnDesignate: { backgroundColor: colors.navy, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnDesignateText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  btnRevoke: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.red, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnRevokeText: { color: colors.red, fontWeight: '700', fontSize: 12 },
  muted: { color: colors.textMuted, padding: 16, textAlign: 'center' },
});
