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
  const { user, updateUser, logout } = useAuth();
  const { isOnline } = useNetwork();
  const [lastSync, setLastSync] = useState(null);
  const [downloaded, setDownloaded] = useState(0);
  const [ressourcesCount, setRessourcesCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [pwd, setPwd] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwdBusy, setPwdBusy] = useState(false);
  const [open, setOpen] = useState(null); // section dépliée (une à la fois)
  const toggle = (id) => setOpen((o) => (o === id ? null : id));

  // E-mail de sécurité (OTP)
  const [secEmail, setSecEmail] = useState('');
  const [secCode, setSecCode] = useState('');
  const [secStep, setSecStep] = useState('idle'); // 'idle' | 'sent'
  const [secBusy, setSecBusy] = useState(false);

  async function sendContactCode() {
    if (!isOnline) return Alert.alert('Hors-ligne', 'Connecte-toi à internet.');
    if (!secEmail.trim()) return Alert.alert('Champ requis', 'Saisis une adresse e-mail réelle.');
    setSecBusy(true);
    try {
      const { data } = await client.post('/me/contact-email', { email: secEmail.trim().toLowerCase() });
      setSecStep('sent');
      Alert.alert('Code envoyé', `Un code de confirmation a été envoyé à ${data.pending}.`);
    } catch (e) {
      Alert.alert('Erreur', e?.response?.data?.errors?.email?.[0] || e?.response?.data?.message || 'Envoi impossible.');
    } finally { setSecBusy(false); }
  }

  async function confirmContactCode() {
    if (secCode.trim().length < 6) return Alert.alert('Code incomplet', 'Saisis le code à 6 chiffres.');
    setSecBusy(true);
    try {
      const { data } = await client.post('/me/contact-email/confirm', { code: secCode.trim() });
      await updateUser(data.user);
      setSecStep('idle'); setSecEmail(''); setSecCode('');
      Alert.alert('Confirmée', 'Adresse e-mail de sécurité confirmée. La double authentification est active.');
    } catch (e) {
      Alert.alert('Erreur', e?.response?.data?.errors?.code?.[0] || e?.response?.data?.message || 'Code invalide.');
    } finally { setSecBusy(false); }
  }

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

        <Section id="secmail" icon="shield" tint={colors.brand} tintBg={colors.brandSoft}
                 title="E-mail de sécurité" subtitle="Code de connexion (double authentification)"
                 open={open} onToggle={toggle}>
          <Text style={styles.deviceNote}>
            Cette adresse e-mail réelle reçoit ton code de connexion. Elle ne remplace pas ton
            identifiant ({user?.email}) — elle sert uniquement à la sécurité.
          </Text>

          {!!user?.contact_email && (
            <Row label="Adresse confirmée" value={`✓ ${user.contact_email}`} valueColor={colors.success} />
          )}
          {!user?.contact_email && !!user?.contact_email_pending && (
            <Row label="En attente" value={user.contact_email_pending} />
          )}

          {secStep === 'idle' ? (
            <>
              <TextInput
                style={styles.input}
                value={secEmail}
                onChangeText={setSecEmail}
                placeholder={user?.contact_email ? 'Nouvelle adresse e-mail réelle' : 'votre.adresse@exemple.com'}
                placeholderTextColor={colors.textLight}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TouchableOpacity style={styles.btnRed} onPress={sendContactCode} disabled={secBusy} activeOpacity={0.85}>
                {secBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnRedText}>Envoyer un code de confirmation</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                style={[styles.input, { textAlign: 'center', fontSize: 22, fontWeight: '800', letterSpacing: 8 }]}
                value={secCode}
                onChangeText={(t) => setSecCode(t.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                placeholderTextColor={colors.textLight}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity style={styles.btnRed} onPress={confirmContactCode} disabled={secBusy} activeOpacity={0.85}>
                {secBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnRedText}>Confirmer</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnOutline} onPress={() => { setSecStep('idle'); setSecCode(''); }} activeOpacity={0.85}>
                <Text style={styles.btnOutlineText}>Annuler</Text>
              </TouchableOpacity>
            </>
          )}
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
          <Icon name="chevron" size={20} color={colors.textLight} />
        </View>
      </TouchableOpacity>
      {isOpen && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

// Champ mot de passe avec bouton œil (afficher / masquer).
function PwdField({ placeholder, value, onChangeText }) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.pwdWrap}>
      <TextInput style={[styles.input, { marginTop: 0, paddingRight: 46 }]} placeholder={placeholder}
                 placeholderTextColor={colors.textLight} secureTextEntry={!show}
                 value={value} onChangeText={onChangeText} autoCapitalize="none" />
      <TouchableOpacity style={styles.pwdEye} onPress={() => setShow((s) => !s)}>
        <Icon name={show ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 24 },
  idCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface, borderRadius: radius.xxl, padding: 16,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  avatarWrap: { position: 'relative' },
  onlineDot: {
    position: 'absolute', right: -1, bottom: -1, width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.success, borderWidth: 3, borderColor: colors.surface,
  },
  name: { fontSize: 19, fontWeight: '900', color: colors.text },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  email: { fontSize: 13, color: colors.textMuted, flex: 1 },
  rolerow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  roleBadge: { fontSize: 12, color: colors.text, fontWeight: '700', backgroundColor: colors.muted,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.xxl, paddingVertical: 16, marginTop: 12,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  statVal: { fontSize: 20, fontWeight: '900', color: colors.text },
  statLbl: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  groupKicker: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.2,
    marginTop: 22, marginBottom: 8, marginLeft: 4 },
  section: { backgroundColor: colors.surface, borderRadius: radius.xl, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadow.card },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  sectionIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  sectionSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 2 },
  input: {
    backgroundColor: colors.muted, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 11, color: colors.text, fontSize: 14, marginTop: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, gap: 12 },
  rowLabel: { color: colors.textMuted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  btnRed: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: 13, marginTop: 14 },
  btnRedText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnOutline: { borderWidth: 1.5, borderColor: colors.brandDark, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  btnOutlineText: { color: colors.brandDark, fontWeight: '700', fontSize: 14 },
  deviceNote: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  pwdWrap: { position: 'relative', marginTop: 10 },
  pwdEye: { position: 'absolute', right: 4, top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 10 },
  btnLogout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.brandSoft, borderRadius: radius.md, paddingVertical: 15, marginTop: 14 },
  btnLogoutText: { color: colors.brand, fontWeight: '800', fontSize: 15 },
  version: { textAlign: 'center', color: colors.textLight, fontSize: 12, marginTop: 18 },
});
