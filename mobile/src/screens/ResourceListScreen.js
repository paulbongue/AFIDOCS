import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import ResourceCard from '../components/ResourceCard';
import SkeletonRows from '../components/Skeleton';
import OfflineBanner from '../components/OfflineBanner';
import Icon from '../components/Icon';
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
  const [activeNiveau, setActiveNiveau] = useState(null); // niveau_id choisi dans la filière
  const [niveauxList, setNiveauxList] = useState([]);     // niveaux de la filière active
  const [browse, setBrowse] = useState(false);   // false = recommandées (ma classe)
  const [view, setView] = useState('list');       // 'list' | 'grid'
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  // Lecture depuis SQLite (fonctionne aussi hors-ligne).
  const loadLocal = useCallback(async () => {
    const fils = await dbApi.getFilieres();
    setFilieres(fils);

    // Tous les niveaux/classes de la filière sélectionnée (pas seulement ceux
    // qui ont déjà des ressources).
    setNiveauxList(activeFiliere != null ? await dbApi.getNiveaux(activeFiliere) : []);

    let list;
    if (browse || !user?.filiere_id) {
      // Exploration (ou admin sans classe) : toutes les ressources.
      const filters = {};
      if (search) filters.search = search;
      if (activeFiliere) filters.filiere_id = activeFiliere;
      if (activeNiveau) filters.niveau_id = activeNiveau;
      list = await dbApi.getRessources(filters, user?.id);
    } else {
      // Recommandées : filière + niveau de l'utilisateur.
      const filters = { filiere_id: user.filiere_id };
      if (user?.niveau_id) filters.niveau_id = user.niveau_id;
      list = await dbApi.getRessources(filters, user?.id);
    }
    setRessources(list);
    setFirstLoad(false);
  }, [browse, search, activeFiliere, activeNiveau, user]);

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

  useEffect(() => { loadLocal(); }, [browse, search, activeFiliere, activeNiveau, loadLocal]);

  async function onRefresh() {
    setRefreshing(true);
    await doSync();
    await loadLocal();
    setRefreshing(false);
  }

  if (firstLoad) {
    return <View style={styles.flex}><SkeletonRows /></View>;
  }

  const hasClass = !!user?.filiere_id;
  const showBrowseUI = browse || !hasClass;

  const header = (
    <View>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {!hasClass ? 'Ressources' : browse ? 'Explorer les ressources' : 'Recommandées pour vous'}
          </Text>
          <Text style={styles.headerSub}>
            {ressources.length} fichier{ressources.length > 1 ? 's' : ''} · {filieres.length} filière{filieres.length > 1 ? 's' : ''}
          </Text>
        </View>
        {hasClass && (
          <TouchableOpacity style={[styles.browseBtn, browse && styles.browseBtnAlt]}
                            onPress={() => { setBrowse((b) => !b); setSearch(''); setActiveFiliere(null); setActiveNiveau(null); }}>
            <Icon name={browse ? 'back' : 'search'} size={14} color={browse ? colors.text : '#fff'} />
            <Text style={[styles.browseText, browse && styles.browseTextAlt]}>
              {browse ? 'Ma classe' : 'Autres'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {!browse && user?.filiere && (
        <Text style={styles.classLine}>
          {user.filiere.code}{user.niveau ? ` · ${user.niveau.nom}` : ''} — {user.filiere.nom}
        </Text>
      )}

      {/* Délégué : publication accessible depuis l'espace Ressources */}
      {user?.role === 'delegue' && (
        <View style={styles.delegRow}>
          <TouchableOpacity style={styles.pubBtn} onPress={() => navigation.navigate('PublishHome')}>
            <Icon name="plus" size={16} color="#fff" />
            <Text style={styles.pubBtnText}>Publier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pubBtnAlt} onPress={() => navigation.navigate('MesRessources')}>
            <Icon name="resources" size={16} color={colors.text} />
            <Text style={styles.pubBtnAltText}>Mes ressources</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bascule liste / grille */}
      <View style={styles.viewToggle}>
        <TouchableOpacity style={[styles.vtBtn, view === 'list' && styles.vtBtnActive]}
                          onPress={() => setView('list')}>
          <Icon name="list" size={15} color={view === 'list' ? '#fff' : colors.textMuted} />
          <Text style={[styles.vtText, view === 'list' && styles.vtTextActive]}>Liste</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.vtBtn, view === 'grid' && styles.vtBtnActive]}
                          onPress={() => setView('grid')}>
          <Icon name="grid" size={15} color={view === 'grid' ? '#fff' : colors.textMuted} />
          <Text style={[styles.vtText, view === 'grid' && styles.vtTextActive]}>Cartes</Text>
        </TouchableOpacity>
      </View>

      {showBrowseUI && (
        <>
          <View style={styles.searchWrap}>
            <View style={styles.searchField}>
              <Icon name="search" size={18} color={colors.textMuted} />
              <TextInput style={styles.search} value={search} onChangeText={setSearch}
                         placeholder="Rechercher une ressource…" placeholderTextColor={colors.textMuted} />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                  <Icon name="close" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {[{ id: null, code: 'Toutes' }, ...filieres].map((item) => {
              const act = activeFiliere === item.id;
              const c = item.id ? (item.couleur || colorForFiliere(item.code)) : colors.red;
              return (
                <TouchableOpacity key={String(item.id)}
                  style={[styles.chip, { borderColor: c }, act && { backgroundColor: c }]}
                  onPress={() => { setActiveFiliere(item.id); setActiveNiveau(null); }}>
                  <Text style={[styles.chipText, { color: act ? '#fff' : c }]}>{item.code}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {activeFiliere != null && (
            <Text style={styles.filiereTitle}>{filieres.find((f) => f.id === activeFiliere)?.nom || ''}</Text>
          )}
          {/* Sous-filtre par niveau / classe une fois la filière choisie */}
          {activeFiliere != null && niveauxList.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <TouchableOpacity
                style={[styles.chipN, !activeNiveau && styles.chipNActive]}
                onPress={() => setActiveNiveau(null)}>
                <Text style={[styles.chipNText, !activeNiveau && styles.chipNTextActive]}>Tous niveaux</Text>
              </TouchableOpacity>
              {niveauxList.map((n) => {
                const act = String(activeNiveau) === String(n.id);
                return (
                  <TouchableOpacity key={n.id}
                    style={[styles.chipN, act && styles.chipNActive]}
                    onPress={() => setActiveNiveau(n.id)}>
                    <Text style={[styles.chipNText, act && styles.chipNTextActive]}>{n.nom}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
        key={view}
        numColumns={view === 'grid' ? 2 : 1}
        columnWrapperStyle={view === 'grid' ? styles.gridWrap : undefined}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <ResourceCard ressource={item} compact={view === 'grid'}
            onPress={() => navigation.navigate('Res