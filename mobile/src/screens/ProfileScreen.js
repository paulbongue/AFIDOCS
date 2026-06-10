import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import OfflineBanner from '../components/OfflineBanner';
import Avatar from '../components/Avatar';
import FiliereBadge from '../components/FiliereBadge';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import { fullSync, getLastSyncAt } from '../services/sync';
import * as dbApi from '../db/database';
import { colors, radius, shadow } from '../theme';

const ROLE_LABEL = { admin: 'Administrateur', delegue: 'Délégué', etudiant: 'Étudiant' };

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isOnline } = useNetwork();
  const [lastSync, setLastSync] = useState(null);
  const [downloaded, setDownloaded] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    setLastSync(await getLastSyncAt());
    const row = await dbApi.countDownloaded();
    setDownloaded(row?.n ?? 0);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  async function handleSync() {
    if (!isOnline) return Alert.alert('Hors-ligne', 'Connecte-toi à internet pour synchroniser.');
    setSyncing(true);
    try {
      const n = await fullSync();
      await refresh();
      Alert.alert('Synchronisation terminée', `${n} ressource(s) à jour.`);
    } catch (_) {
      Alert.alert('Erreur', 'Synchronisation impossible.');
    } finally { setSyncing(false); }
  }

  function confirmLogout() {
    Alert.alert('Déconnexion', "Se déconnecter ? Les fichiers hors-ligne resteront sur l'appareil.", [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: logout },
    ]);
  }

  const syncLabel = lastSync ? new Date(lastSync).toLocaleString('fr-FR') : 'jamais';

  return (
    <View style={styles.flex}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.content}>
        {/* En-tête profil */}
        <View style={styles.head}>
          <Avatar name={user?.name} size={64} bg={colors.navy} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.rolerow}>
              <Text style={styles.role}>{ROLE_LABEL[user?.role] || user?.role}</Text>
              {user?.filiere && <FiliereBadge code={user.filiere.code} couleur={user.filiere.couleur} small />}
            </View>
          </View>
        </View>

        {/* Informations personnelles */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations personnelles</Text>
          <Row label="Nom d'utilisateur" value={user?.name} />
          <Row label="Statut" value={ROLE_LABEL[user?.role] || user?.role} />
          {user?.filiere && <Row label="Filière" value={`${user.filiere.code} — ${user.filiere.nom}`} />}
        </View>

        {/* Synchronisation / hors-ligne */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Synchronisation</Text>
          <Row label="Statut réseau" value={isOnline ? '● En ligne' : '● Hors-ligne'}
               valueColor={isOnline ? colors.success : colors.offline} />
          <Row label="Dernière synchro" value={syncLabel} />
          <Row label="Fichiers hors-ligne" value={String(downloaded)} />

          <TouchableOpacity style={styles.btnRed} onPress={handleSync} disabled={syncing} activeOpacity={0.85}>
            {syncing ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnRedText}>🔄  Synchroniser maintenant</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnLogout} onPress={confirmLogout}>
          <Text style={styles.btnLogoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, valueColor }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  name: { fontSize: 19, fontWeight: '900', color: colors.navy },
  email: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  rolerow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 6 },
  role: { fontSize: 13, color: colors.text, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, marginTop: 16,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.navy, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, gap: 12 },
  rowLabel: { color: colors.textMuted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  btnRed: { backgroundColor: colors.red, borderRadius: radius.sm, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  btnRedText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnLogout: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnLogoutText: { color: colors.red, fontWeight: '800', fontSize: 15 },
});
