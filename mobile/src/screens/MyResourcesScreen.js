import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import OfflineBanner from '../components/OfflineBanner';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { colors, radius, colorForFiliere, labelForType } from '../theme';

// Ressources publiées par le délégué (ou l'admin), avec suppression.
export default function MyResourcesScreen({ navigation }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/ressources');
      setItems((data.data || []).filter((r) => r.user_id === user?.id));
    } catch (_) {} finally { setLoading(false); }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function confirmDelete(item) {
    Alert.alert('Supprimer', `Supprimer « ${item.titre} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          const path = user?.role === 'admin' ? `/admin/ressources/${item.id}` : `/ressources/${item.id}`;
          try { await client.delete(path); await load(); }
          catch (_) { Alert.alert('Erreur', 'Suppression impossible.'); }
        },
      },
    ]);
  }

  if (loading && items.length === 0) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>;
  }

  return (
    <View style={styles.flex}>
      <OfflineBanner />
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: 14 }}
        ListHeaderComponent={<Text style={styles.title}>Mes ressources publiées ({items.length})</Text>}
        renderItem={({ item }) => {
          const f = item.matiere?.niveau?.filiere;
          return (
            <View style={styles.row}>
              <TouchableOpacity style={styles.main}
                onPress={() => navigation.navigate('Ressources', { screen: 'RessourceDetail', params: { id: item.id, titre: item.titre } })}>
                <View style={[styles.icon, { backgroundColor: f?.couleur || colorForFiliere(f?.code) }]}>
                  <Text style={styles.iconText}>{labelForType(item.type_fichier)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resTitle} numberOfLines={1}>{item.titre}</Text>
                  <Text style={styles.resMeta} numberOfLines={1}>
                    {f?.code} · {item.matiere?.niveau?.nom} · {item.matiere?.nom}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.del} onPress={() => confirmDelete(item)}>
                <Text style={styles.delText}>Suppr.</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Tu n'as encore rien publié.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: { fontSize: 18, fontWeight: '900', color: colors.navy, marginBottom: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface,
    borderRadius: radius.md, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  main: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  icon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  resTitle: { fontWeight: '800', color: colors.navy },
  resMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  del: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  delText: { color: colors.red, fontWeight: '700', fontSize: 12 },
  empty: { color: colors.textMuted, textAlign: 'center', padding: 30 },
});
