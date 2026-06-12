import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import OfflineBanner from '../components/OfflineBanner';
import StatCard from '../components/StatCard';
import ResourceCard from '../components/ResourceCard';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import { fullSync } from '../services/sync';
import * as dbApi from '../db/database';
import { colors, space } from '../theme';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const [stats, setStats] = useState({ disponibles: 0, telechargees: 0, filieres: 0 });
  const [recents, setRecents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [all, dl, fils] = await Promise.all([
      dbApi.getRessources({}, user?.id),
      dbApi.countDownloaded(user?.id),
      dbApi.getFilieres(),
    ]);
    setStats({ disponibles: all.length, telechargees: dl?.n ?? 0, filieres: fils.length });
    setRecents(all.slice(0, 5));
  }, [user]);

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      await load();
      if (isOnline) {
        try { await fullSync(); } catch (_) {}
        if (active) await load();
      }
    })();
    return () => { active = false; };
  }, [load, isOnline]));

  async function onRefresh() {
    setRefreshing(true);
    if (isOnline) { try { await fullSync(); } catch (_) {} }
    await load();
    setRefreshing(false);
  }

  const prenom = (user?.name || '').split(' ')[0] || 'étudiant';

  function openDetail(item) {
    navigation.navigate('Ressources', {
      screen: 'RessourceDetail',
      params: { id: item.id, titre: item.titre },
    });
  }

  return (
    <View style={styles.flex}>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.hello}>Bonjour, {prenom}</Text>

        <View style={styles.statsRow}>
          <StatCard value={stats.disponibles} label="Ressources disponibles" icon="📘" />
          <StatCard value={stats.telechargees} label="Hors-ligne" icon="📥" />
          {user?.filiere_id ? (
            <StatCard
              value={user.filiere?.code || '—'}
              label={`${user.niveau?.nom ? user.niveau.nom + ' · ' : ''}${user.filiere?.nom || ''}`}
              icon="🎓"
            />
          ) : (
            <StatCard value={stats.filieres} label="Filières" icon="🎓" />
          )}
        </View>

        <Text style={styles.section}>Ressources récentes</Text>

        {recents.length === 0 ? (
          <Text style={styles.empty}>
            {isOnline
              ? 'Aucune ressource pour le moment.'
              : 'Aucune ressource en cache. Connecte-toi pour synchroniser.'}
          </Text>
        ) : (
          recents.map((item) => (
            <View key={String(item.id)} style={styles.cardWrap}>
              <ResourceCard ressource={item} onPress={() => openDetail(item)} />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingVertical: space.lg },
  hello: { fontSize: 22, fontWeight: '900', color: colors.navy, paddingHorizontal: 16, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14 },
  section: { fontSize: 16, fontWeight: '800', color: colors.navy, paddingHorizontal: 16, marginTop: 24, marginBottom: 6 },
  empty: { color: colors.textMuted, paddingHorizontal: 16, marginTop: 8, lineHeight: 20 },
  cardWrap: { marginLeft: -0 },
});
