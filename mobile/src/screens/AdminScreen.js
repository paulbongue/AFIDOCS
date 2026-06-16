import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import OfflineBanner from '../components/OfflineBanner';
import StatCard from '../components/StatCard';
import AdminActivity from '../components/AdminActivity';
import client from '../api/client';
import { colors, radius } from '../theme';

// Hub Admin (mobile) : statistiques + une rubrique par bouton.
export default function AdminScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { const { data } = await client.get('/admin/stats'); setStats(data); } catch (_) {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  const t = stats?.totaux;
  const rubriques = [
    { icon: '⬆️', label: 'Publier une ressource', sub: 'Dans n\'importe quelle filière', to: 'AdminPublish' },
    { icon: '⚙️', label: 'Centre de contrôle', sub: 'Délégués par classe', to: 'AdminControl' },
    { icon: '▥', label: 'Gestion pédagogique', sub: 'Filières · niveaux · matières', to: 'AdminPedagogie' },
    { icon: '👥', label: 'Utilisateurs', sub: 'Créer / supprimer des comptes', to: 'AdminUsers' },
    { icon: '⚑', label: 'Modération', sub: 'Retirer des ressources', to: 'AdminModeration' },
  ];

  return (
    <View style={styles.flex}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.content}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={styles.title}>Administration</Text>

        {t && (
          <View style={styles.statsRow}>
            <StatCard value={t.ressources} label="Ressources" icon="📘" />
            <StatCard value={t.utilisateurs} label="Utilisateurs" icon="👥" />
            <StatCard value={t.filieres} label="Filières" icon="🎓" />
          </View>
        )}

        <Text style={styles.section}>Rubriques</Text>
        {rubriques.map((r) => (
          <TouchableOpacity key={r.to} style={styles.rubrique} onPress={() => navigation.navigate(r.to)}>
            <Text style={styles.rIcon}>{r.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rLabel}>{r.label}</Text>
              <Text style={styles.rSub}>{r.sub}</Text>
            </View>
            <Text style={styles.rChevron}>›</Text>
          </TouchableOpacity>
        ))}

        <AdminActivity />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '900', color: colors.navy, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 10 },
  section: { fontSize: 16, fontWeight: '800', color: colors.navy, marginTop: 24, marginBottom: 8 },
  rubrique: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface,
    borderRadius: radius.md, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  rIcon: { fontSize: 22 },
  rLabel: { fontSize: 15, fontWeight: '800', color: colors.navy },
  rSub: { fontSize: 12, color: colors.te