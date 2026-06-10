import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import ResourceCard from '../components/ResourceCard';
import OfflineBanner from '../components/OfflineBanner';
import { useNetwork } from '../context/NetworkContext';
import { fullSync } from '../services/sync';
import * as dbApi from '../db/database';
import { colors, colorForFiliere } from '../theme';

export default function ResourceListScreen({ navigation }) {
  const { isOnline } = useNetwork();
  const [ressources, setRessources] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [search, setSearch] = useState('');
  const [activeFiliere, setActiveFiliere] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  // Lecture depuis SQLite (fonctionne aussi hors-ligne).
  const loadLocal = useCallback(async () => {
    const filters = {};
    if (search) filters.search = search;
    if (activeFiliere) filters.filiere_id = activeFiliere;
    const [list, fils] = await Promise.all([
      dbApi.getRessources(filters),
      dbApi.getFilieres(),
    ]);
    setRessources(list);
    setFilieres(fils);
    setFirstLoad(false);
  }, [search, activeFiliere]);

  // Synchronisation reseau si en ligne, puis relecture locale.
  const doSync = useCallback(async () => {
    if (!isOnline) return;
    setSyncing(true);
    try {
      await fullSync();
    } catch (_) { /* on garde le cache local en cas d'echec */ }
    finally {
      setSyncing(false);
    }
  }, [isOnline]);

  // A chaque affichage de l'ecran : relire le cache (et synchroniser si en ligne).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        await loadLocal();
        if (isOnline) {
          await doSync();
          if (active) await loadLocal();
        }
      })();
      return () => { active = false; };
    }, [loadLocal, doSync, isOnline])
  );

  useEffect(() => { loadLocal(); }, [search, activeFiliere, loadLocal]);

  async function onRefresh() {
    setRefreshing(true);
    await doSync();
    await loadLocal();
    setRefreshing(false);
  }

  if (firstLoad) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.red} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <OfflineBanner />

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher une ressource…"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Filtres par filiere (chips colores) */}
      <View style={styles.chipsWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, code: 'Toutes' }, ...filieres]}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.chips}
          renderItem={({ item }) => {
            const active = activeFiliere === item.id;
            const c = item.id ? (item.couleur || colorForFiliere(item.code)) : colors.red;
            return (
              <TouchableOpacity
                style={[styles.chip, { borderColor: c }, active && { backgroundColor: c }]}
                onPress={() => setActiveFiliere(item.id)}
              >
                <Text style={[styles.chipText, { color: active ? '#fff' : c }]}>{item.code}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {syncing && (
        <Text style={styles.syncing}>Synchronisation en cours…</Text>
      )}

      <FlatList
        data={ressources}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ResourceCard
            ressource={item}
            onPress={() => navigation.navigate('RessourceDetail', { id: item.id, titre: item.titre })}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isOnline
                ? 'Aucune ressource trouvee.'
                : 'Aucune ressource en cache. Connecte-toi a internet pour synchroniser.'}
            </Text>
          </View>
        }
        contentContainerStyle={ressources.length === 0 && styles.flexGrow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  flexGrow: { flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  searchWrap: { padding: 12, paddingBottom: 6 },
  search: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.text,
  },
  chipsWrap: { paddingBottom: 4 },
  chips: { paddingHorizontal: 12, gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  chipText: { fontWeight: '700', fontSize: 12 },
  syncing: { textAlign: 'center', color: colors.textMuted, fontSize: 12, paddingVertical: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
