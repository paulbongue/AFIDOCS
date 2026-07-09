import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import OfflineBanner from '../components/OfflineBanner';
import StatCard from '../components/StatCard';
import ResourceCard from '../components/ResourceCard';
import Icon from '../components/Icon';
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
        <Text style={styles.kicker}>BIENVENUE</Text>
        <Text style={styles.hello}>Bonjour, {prenom} 👋</Text>

        <View style={styles.statsRow}>
          <StatCard
            value={stats.disponibles}
            label="Ressources"
            icon={<Icon name="resources" size={18} color={colors.filePdf} />}
            tintBg="#EFE7FC"
          />
          <StatCard
            value={stats.telechargees}
            label="Hors-ligne"
            icon={<Icon name="download" size={18} color={colors.download} />}
            tintBg="#E3F4E7"
          />
          {user?.filiere_id ? (
            <StatCard
              value={user.filiere?.code || '—'}
              label={`${user.niveau?.nom ? user.niveau.nom + ' · ' : ''}${user.filiere?.nom || ''}`}
              icon={<Icon name="grad" size={18} color={colors.brandDark} />}
              tintBg="#E7EBF3"
            />
          ) : (
            <StatCard
              value={stats.filieres}
              label="Filières"
              icon={<Icon name="grad" size={18} color={colors.brandDark} />}
              tintBg="#E7EBF3"
            />
          )}
        </View>

        {user?.role !== 'admin' && (
          <TouchableOpacity
            style={styles.evalCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Ressources', { screen: 'Evaluations' })}
          >
            <View style={styles.evalIcon}>
              <Icon name="star" size={20} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.evalTitle}>Évaluer les enseignants</Text>
              <Text style={styles.evalSub}>Notez les modules de votre classe</Text>
            </View>
            <Icon name="chevron" size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}

        <View style={styles.sectionHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.section}>Ressources récentes</Text>
            <Text style={styles.sectionSub}>Mis à jour aujourd'hui</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Ressources')} activeOpacity={0.7}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {recents.length === 0 ? (
          <Text style={styles.empty}>
            {isOnline
              ? 'Aucune ressource pour le moment.'
              : 'Aucune ressource en cache. Connecte-toi pour synchroniser.'}
          </Text>
        ) : (
          recents.map((item) => (
            <ResourceCard key={String(item.id)} ressource={item} onPress={() => openDetail(item)} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingTop: space.lg, paddingBottom: space.xl },
  kicker: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.5, paddingHorizontal: 16 },
  hello: { fontSize: 24, fontWeight: '900', color: colors.text, paddingHorizontal: 16, marginTop: 2, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 24, marginBottom: 8 },
  section: { fontSize: 17, fontWeight: '800', color: colors.text },
  sectionSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  seeAll: { fontSize: 13, fontWeight: '700', color: colors.brand },
  empty: { color: colors.textMuted, paddingHorizontal: 16, marginTop: 8, lineHeight: 20 },
  evalCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 14, marginTop: 18,
    backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border,
  },
  evalIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSoft },
  evalTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  evalSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
