import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import OfflineBanner from '../components/OfflineBanner';
import StatCard from '../components/StatCard';
import AdminActivity from '../components/AdminActivity';
import Icon from '../components/Icon';
import client from '../api/client';
import { colors, radius, shadow } from '../theme';

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
    { icon: 'plus', tint: colors.filePdf, bg: '#F0E8FC', label: 'Publier une ressource', sub: 'Dans n\'importe quelle filière', to: 'AdminPublish' },
    { icon: 'settings', tint: colors.fileDocx, bg: '#E7E9FB', label: 'Centre de contrôle', sub: 'Délégués par classe', to: 'AdminControl' },
    { icon: 'resources', tint: colors.download, bg: '#E3F4E7', label: 'Gestion pédagogique', sub: 'Filières · niveaux · matières', to: 'AdminPedagogie' },
    { icon: 'users', tint: colors.notif, bg: '#FDEBDD', label: 'Utilisateurs', sub: 'Créer / supprimer des comptes', to: 'AdminUsers' },
    { icon: 'shield', tint: colors.brand, bg: colors.brandSoft, label: 'Modération', sub: 'Retirer des ressources', to: 'AdminModeration' },
  ];

  return (
    <View style={styles.flex}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.content}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={styles.kicker}>ADMINISTRATION</Text>
        <Text style={styles.title}>Tableau de bord</Text>

        {t && (
          <View style={styles.statsRow}>
            <StatCard value={t.ressources} label="Ressources"
                      icon={<Icon name="resources" size={18} color={colors.filePdf} />} tintBg="#F0E8FC" />
            <StatCard value={t.utilisateurs} label="Utilisateurs"
                      icon={<Icon name="users" size={18} color={colors.fileDocx} />} tintBg="#E7E9FB" />
            <StatCard value={t.filieres} label="Filières"
                      icon={<Icon name="grad" size={18} color={colors.brandDark} />} tintBg="#E7EBF3" />
          </View>
        )}

        <Text style={styles.section}>Rubriques</Text>
        {rubriques.map((r) => (
          <TouchableOpacity key={r.to} style={styles.rubrique} onPress={() => navigation.navigate(r.to)} activeOpacity={0.7}>
            <View style={[styles.rIcon, { backgroundColor: r.bg }]}>
              <Icon name={r.icon} size={19} color={r.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rLabel}>{r.label}</Text>
              <Text style={styles.rSub}>{r.sub}</Text>
            </View>
            <Icon name="chevron" size={20} color={colors.textLight} />
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
  kicker: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.5 },
  title: { fontSize: 22, fontWeight: '900', color: colors.text, marginTop: 1, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 10 },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 24, marginBottom: 8 },
  rubrique: {
    flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: colors.surface,
    borderRadius: radius.xl, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  rIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  rSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
