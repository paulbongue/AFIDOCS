import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';

import OfflineBanner from '../components/OfflineBanner';
import Avatar from '../components/Avatar';
import FiliereBadge from '../components/FiliereBadge';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import { fullSync, getLastSyncAt } from '../services/sync';
import client from '../api/client';
import * as dbApi from '../db/database';
import { colors, radius, shadow } from '../theme';

const ROLE_LABEL = { admin: 'Administrateur', delegue: 'Délégué', etudiant: 'Étudiant' };
const APP_VERSION = Constants?.expoConfig?.version || '1.0.1';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isOnline } = useNetwork();
  const [lastSync, setLastSync] = useState(null);
  const [downloaded, setDownloaded] = useState(0);
  const [ressourcesCount, setRessourcesCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [pwd, setPwd] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwdBusy, setPwdBusy] = useState(false);
  const [open, setOpen] = useState(null); // section dépliée (une à la fois)
  const toggle = (id) => setOpen((o) => (o === id ? null : id));

  const refresh = useCallback(async () => {
    setLastSync(await getLastSyncAt());
    const row = await dbApi.countDownloaded(user?.id);
    setDownloaded(row?.n ?? 0);
    try { const all = await dbApi.getRessources({}, user?.id); setRessourcesCount(all.length); } catch (_) {}
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

  async function logoutOtherDevices() {
    if (!isOnline) return Alert.alert('Hors-ligne', 'Connecte-toi à internet.');
    try {
      const { data } = await client.post('/logout-others');
      Alert.alert('Terminé', `Déconnecté de ${data.revoked ?? 0} autre(s) appareil(s).`);
    } catch (_) {
      Alert.alert('Erreur', 'Action impossible.');
    }
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
  const isAdmin = user?.role === 'admin';

  return (
    <KeyboardAvoidingView style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Carte d'identité */}
        <View style={styles.idCard}>
          <View style={styles.avatarWrap}>
            <Avatar name={user?.name} size={60} bg={colors.brandDark} />
            <View style={styles.onlineDot} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{user?.name}</Text>
            <View style={styles.emailRow}>
              <Icon name="user" size={13} color={colors.textMuted} />
              <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
            </View>
            <View style={styles.rolerow}>
              <Text style={styles.roleBadge}>{ROLE_LABEL[user?.role] || user?.role}</Text>
              {user?.filiere && <FiliereBadge code={user.filiere.code} couleur={user.filiere.couleur} small />}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statVal}>{ressourcesCount}</Text>
            <Text style={styles.statLbl}>Ressources</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statVal}>{downloaded}</Text>
            <Text style={styles.statLbl}>Hors-ligne</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statVal}>{user?.filiere?.code || '—'}</Text>
            <Text style={styles.statLbl}>{user?.niveau?.nom || 'Classe'}</Text>
          </View>
        </View>

        <Text style={styles.groupKicker}>COMPTE & PARAMÈTRES</Text>

        <Section id="info" icon="user" tint={colors.filePdf} tintBg="#F0E8FC"
                 title="Informations personnelles" subtitle="Nom, email, statut"
                 open={open} onToggle={toggle}>
          <Row label="Nom d'utilisateur" value={user?.name} />
          <Row label="Statut" value={ROLE_LABEL[user?.role] || user?.role} />
          {user?.filiere && <Row label="Filière" value={`${user.filiere.code} — ${user.filiere.nom}`} />}
          {user?.niveau && <Row label="Niveau / Classe" value={`${user.filiere?.code || ''} · ${user.niveau.nom}`} />}
        </Section>

        {!isAdmin && (
          <Section id="sync" icon="sync" tint={colors.fileDocx} tintBg="#E7E9FB"
                   title="Synchronisation" subtitle="Cours hors-ligne"
                   open={open} onToggle={toggle}>
            <Row label="Statut réseau" value={isOnline ? '● En ligne' : '● Hors-ligne'}
                 valueColor={isOnline ? colors.success : colors.offline} />
            <Row label="Dernière synchro" value={syncLabel} />
            <Row label="Fichiers hors-ligne" value={String(downloaded)} />
            <TouchableOpacity style={styles.btnRed} onPress={handleSync} disabled={syncing} activeOpacity={0.85}>
              {syncing ? <ActivityIndicator color="#fff" /> : (
                <><Icon name="sync" size={17} color="#fff" /><Text style={styles.btnRedText}>Synchroniser maintenant</Text></>
              )}
            </TouchableOpacity>
          </Section>
        )}

        <Section id="security" icon="shield" tint={colors.download} tintBg="#E3F4E7"
                 title="Sécurité — Mot de passe" subtitle="Modifier le mot de passe"
                 open={open} onToggle={toggle}>
          <PwdField placeholder="Mot de passe actuel" value={pwd.current_password}
                    onChangeText={(t) => setPwd({ ...pwd, current_password: t })} />
          <PwdField placeholder="Nouveau mot de passe" value={pwd.password}
                    onChangeText={(t) => setPwd({ ...pwd, password: t })} />
          <PwdField placeholder="Confirmer le nouveau mot de passe" value={pwd.password_confirmation}
                    onChangeText={(t) => setPwd({ ...pwd, password_confirmation: t })} />
          <TouchableOpacity style={styles.btnRed} onPress={changePassword} disabled={pwdBusy} activeOpacity={0.85}>
            {pwdBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnRedText}>Mettre à jour</Text>}
          </TouchableOpacity>
        </Section>

        <Section id="devices" icon="device" tint={colors.notif} tintBg="#FDEBDD"
                 title="Appareils connectés" subtitle="Maximum 3 appareils"
                 open={open} onToggle={toggle}>
          <Text style={styles.deviceNote}>
            Un compte peut être connecté sur 3 appareils au maximum. Au-delà, le plus ancien est
            déconnecté. Tu peux aussi déconnecter manuellement les autres.
          </Text>
          <TouchableOpacity style={styles.btnOutline} onPress={logoutOtherDevices} activeOpacity={0.85}>
            <Text style={styles.btnOutlineText}>Déconnecter les autres appareils</Text>
          </TouchableOpacity>
        </Section>

        <TouchableOpacity style={styles.btnLogout} onPress={confirmLogout} activeOpacity={0.85}>
          <Icon name="logout" size={18} color={colors.brand} />
          <Text style={styles.btnLogoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={styles.version}>AFI-DOCS · v{APP_VERSION}</Text>
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

// Ligne de réglage façon maquette : icône ronde + titre + sous-texte + chevron.
// Au tap, la section se déplie (les contrôles restent en place, pas de remontage).
function Section({ id, icon, tint, tintBg, title, subtitle, open, onToggle, children }) {
  const isOpen = open === id;
  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHead} onPress={() => onToggle(id)} activeOpacity={0.7}>
        <View style={[styles.sectionIcon, { backgroundColor: tintBg }]}>
          <Icon name={icon} size={18} color={tint} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {!!subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
        </View>
        <View style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}>
     