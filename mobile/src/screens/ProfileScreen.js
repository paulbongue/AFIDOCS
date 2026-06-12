import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import OfflineBanner from '../components/OfflineBanner';
import Avatar from '../components/Avatar';
import FiliereBadge from '../components/FiliereBadge';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import { fullSync, getLastSyncAt } from '../services/sync';
import client from '../api/client';
import * as dbApi from '../db/database';
import { colors, radius, shadow } from '../theme';

const ROLE_LABEL = { admin: 'Administrateur', delegue: 'Délégué', etudiant: 'Étudiant' };

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isOnline } = useNetwork();
  const [lastSync, setLastSync] = useState(null);
  const [downloaded, setDownloaded] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [pwd, setPwd] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwdBusy, setPwdBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLastSync(await getLastSyncAt());
    const row = await dbApi.countDownloaded(user?.id);
    setDownloaded(row?.n ?? 0);
  }, [user]);

  async function changePassword() {
    if (!isOnline) return Alert.alert('Hors-ligne', 'Connecte-toi à internet pour changer le mot de passe.');
    if (!pwd.current_password || !pwd.password) {
      return Alert.alert('Champs requis', 'Renseigne le mot de passe actuel et le nouveau.');
    }
    if (pwd.password !== pwd.password_confirmation) {
      return Alert.alert('Erreur', 'Les deux nouveaux mots de passe ne correspondent pas.');
    }
    setPwdBusy(true);
    try {
      await client.post('/me/password', pwd);
      setPwd({ current_password: '', password: '', password_confirmation: '' });
      Alert.alert('Mot de passe', 'Mot de passe mis à jour.');
    } catch (e) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Mise à jour impossible.');
    } finally { setPwdBusy(false); }
  }

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
    <KeyboardAvoidingView style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
          {user?.niveau && <Row label="Niveau / Classe" value={`${user.filiere?.code || ''} · ${user.niveau.nom}`} />}
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

        {/* Sécurité — changement de mot de passe */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sécurité — changer mon mot de passe</Text>
          <TextInput style={styles.input} placeholder="Mot de passe actuel" placeholderTextColor={colors.textLight}
                     secureTextEntry value={pwd.current_password}
                     onChangeText={(t) => setPwd({ ...pwd, current_password: t })} />
          <TextInput style={styles.input} placeholder="Nouveau mot de passe" placeholderTextColor={colors.textLight}
                     secureTextEntry value={pwd.password}
                     onChangeText={(t) => setPwd({ ...pwd, password: t })} />
          <TextInput style={styles.input} placeholder="Confirmer le nouveau mot de passe" placeholderTextColor={colors.textLight}
                     secureTextEntry value={pwd.password_confirmation}
                     onChangeText={(t) => setPwd({ ...pwd, password_confirmation: t })} />
          <TouchableOpacity style={styles.btnRed} onPress={changePassword} disabled={pwdBusy} activeOpacity={0.85}>
            {pwdBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnRedText}>Mettre à jour</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnLogout} onPress={confirmLogout}>
          <Text style={styles.btnLogoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 14, marginTop: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, gap: 12 },
  rowLabel: { color: colors.textMuted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  btnRed: { backgroundColor: colors.red, borderRadius: radius.sm, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  btnRedText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnLogout: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnLogoutText: { color: colors.red, fontWeight: '800', fontSize: 15 },
});
