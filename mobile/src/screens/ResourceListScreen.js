import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import ResourceCard from '../components/ResourceCard';
import OfflineBanner from '../components/OfflineBanner';
import { useNetwork } from '../context/NetworkContext';
import { useAuth } from '../context/AuthContext';
import { fullSync } from '../services/sync';
import * as dbApi from '../db/database';
import { colors, colorForFiliere } from '../theme';

export default function ResourceListScreen({ navigation }) {
  const { isOnline } = useNetwork();
  const { user } = useAuth();
  const [ressources, setRessources] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [search, setSearch] = useState('');
  const [activeFiliere, setActiveFiliere] = useState(null);
  const [browse, setBrowse] = useState(false);   // false = recommandées (ma classe)
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  // Lecture depuis SQLite (fonctionne aussi hors-ligne).
  const loadLocal = useCallback(async () => {
    const fils = await dbApi.getFilieres();
    setFilieres(fils);

    let list;
    if (browse || !user?.filiere_id) {
      // Exploration (ou admin sans classe) : toutes les ressources.
      const filters = {};
      if (search) filters.search = search;
      if (activeFiliere) filters.filiere_id = activeFiliere;
      list = await dbApi.getRessources(filters, user?.id);
    } else {
      // Recommandées : filière + niveau de l'utilisateur.
      const filters = { filiere_id: user.filiere_id };
      if (user?.niveau_id) filters.niveau_id = user.niveau_id;
      list = await dbApi.getRessources(filters, user?.id);
    }
    setRessources(list);
    setFirstLoad(false);
  }, [browse, search, activeFiliere, user]);

  const doSync = useCallback(async () => {
    if (!isOnline) return;
    setSyncing(true);
    try { await fullSync(); } catch (_) {} finally { setSyncing(false); }
  }, [isOnline]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        await loadLocal();
        if (isOnline) { await doSync(); if (active) await loadLocal(); }
      })();
      return () => { active = false; };
    }, [loadLocal, doSync, isOnline])
  );

  useEffect(() => { loadLocal(); }, [browse, search, activeFiliere, loadLocal]);

  async function onRefresh() {
    setRefreshing(true);
    await doSync();
    await loadLocal();
    setRefreshing(false);
  }

  if (firstLoad) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>;
  }

  const hasClass = !!user?.filiere_id;
  const showBrowseUI = browse || !hasClass;

  const header = (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>
          {!hasClass ? 'Ressources' : browse ? 'Explorer les ressources' : 'Recommandées pour vous'}
        </Text>
        {hasClass && (
          <TouchableOpacity style={[styles.browseBtn, browse && styles.browseBtnAlt]}
                            onPress={() => { setBrowse((b) => !b); setSearch(''); setActiveFiliere(null); }}>
            <Text style={[styles.browseText, browse && styles.browseTextAlt]}>
              {browse ? '← Ma classe' : '🔎 Autres ressources'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {!browse && user?.filiere && (
        <Text style={styles.classLine}>
          {user.filiere.code}{user.niveau ? ` · ${user.niveau.nom}` : ''} — {user.filiere.nom}
        </Text>
      )}

      {showBrowseUI && (
        <>
          <View style={styles.searchWrap}>
            <TextInput style={styles.search} value={search} onChangeText={setSearch}
                       placeholder="Rechercher une ressource…" placeholderTextColor={colors.textMuted} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {[{ id: null, code: 'Toutes' }, ...filieres].map((item) => {
              const act = activeFiliere === item.id;
              const c = item.id ? (item.couleur || colorForFiliere(item.code)) : colors.red;
              return (
                <TouchableOpacity key={String(item.id)}
                  style={[styles.chip, { borderColor: c }, act && { backgroundColor: c }]}
                  onPress={() => setActiveFiliere(item.id)}>
                  <Text style={[styles.chipText, { color: act ? '#fff' : c }]}>{item.code}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {activeFiliere != null && (
            <Text style={styles.filiereTitle}>{filieres.find((f) => f.id === activeFiliere)?.nom || ''}</Text>
          )}
        </>
      )}

      {syncing && <Text style={styles.syncing}>Synchronisation en cours…</Text>}
    </View>
  );

  return (
    <View style={styles.flex}>
      <OfflineBanner />
      <FlatList
        data={ressources}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <ResourceCard ressource={item}
            onPress={() => navigation.navigate('RessourceDetail', { id: item.id, titre: item.titre })} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {showBrowseUI
                ? (isOnline ? 'Aucune ressource trouvée.' : 'Aucune ressource en cache.')
                : 'Aucune ressource pour votre classe pour l’instant.\nTouchez « Autres ressources » pour explorer.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 14, paddingBottom: 6 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: colors.navy, flex: 1 },
  browseBtn: { backgroundColor: colors.red, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  browseBtnAlt: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border },
  browseText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  browseTextAlt: { color: colors.navy },
  classLine: { color: colors.textMuted, paddingHorizontal: 14, marginBottom: 4, fontWeight: '600' },
  searchWrap: { padding: 12, paddingBottom: 6 },
  search: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.text,
  },
  chips: { paddingHorizontal: 12, gap: 8, paddingBottom: 6 },
  chip: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  chipText: { fontWeight: '700', fontSize: 12 },
  filiereTitle: { fontSize: 15, fontWeight: '800', color: colors.navy, paddingHorizontal: 16, paddingTop: 2, paddingBottom: 4 },
  syncing: { textAlign: 'center', color: colors.textMuted, fontSize: 12, paddingVertical: 4 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
