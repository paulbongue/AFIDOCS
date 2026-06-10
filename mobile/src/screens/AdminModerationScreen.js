import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import OfflineBanner from '../components/OfflineBanner';
import client from '../api/client';
import { colors, radius, colorForFiliere, labelForType } from '../theme';

// Modération (admin) : suppression de n'importe quelle ressource.
export default function AdminModerationScreen() {
  const [ressources, setRessources] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/ressources', { params: search ? { search } : {} });
      setRessources(data.data || []);
    } catch (_) {} finally { setLoading(false); }
  }, [search]);

  useFocusEffect(useCallback(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]));

  function confirmDelete(item) {
    Alert.alert('Modération', `Supprimer « ${item.titre} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try { await client.delete(`/admin/ressources/${item.id}`); await load(); }
          catch (_) { Alert.alert('Erreur', 'Suppression impossible.'); }
        },
      },
    ]);
  }

  return (
    <View style={styles.flex}>
      <OfflineBanner />
      <View style={styles.searchWrap}>
        <TextInput style={styles.search} value={search} onChangeText={setSearch}
                   placeholder="Rechercher une ressource…" placeholderTextColor={colors.textLight} />
      </View>
      <FlatList
        data={ressources}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => {
          const f = item.matiere?.niveau?.filiere;
          return (
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: f?.couleur || colorForFiliere(f?.code) }]}>
                <Text style={styles.iconText}>{labelForType(item.type_fichier)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resTitle} numberOfLines={1}>{item.titre}</Text>
                <Text style={styles.resMeta} numberOfLines={1}>
                  {f?.code} · {item.matiere?.nom} · {item.auteur?.name}
                </Text>
              </View>
              <TouchableOpacity style={styles.del} onPress={() => confirmDelete(item)}>
                <Text style={styles.delText}>Suppr.</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>{loading ? 'Chargement…' : 'Aucune ressource.'}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  searchWrap: { padding: 12 },
  search: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, color: colors.text,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface,
    borderRadius: radius.md, padding: 12, marginHorizontal: 14, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  icon: { width: 40, height: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  resTitle: { fontWeight: '800', color: colors.navy },
  resMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  del: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  delText: { color: colors.red, fontWeight: '700', fontSize: 12 },
  empty: { color: colors.textMuted, textAlign: 'center', padding: 30 },
});
