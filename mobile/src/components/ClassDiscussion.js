import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Linking, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';

import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import client from '../api/client';
import { colors, radius, labelForType, formatSize } from '../theme';

// Espace de discussion de la classe de l'utilisateur (son niveau).
export default function ClassDiscussion({ focusMsg, focusTs }) {
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const navigation = useNavigation();
  const niveauId = user?.niveau_id;

  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [schedBusy, setSchedBusy] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const [showMembers, setShowMembers] = useState(false);

  // Arrivée depuis une notification : surligne le message ciblé.
  useEffect(() => {
    if (!focusMsg) return;
    setHighlightId(Number(focusMsg));
    const t = setTimeout(() => setHighlightId(null), 2600);
    return () => clearTimeout(t);
  }, [focusMsg, focusTs]);

  const load = useCallback(async () => {
    if (!niveauId || !isOnline) return;
    setErr(null);
    try {
      const { data } = await client.get(`/classes/${niveauId}/discussion`);
      setData(data);
    } catch (e) {
      setErr(e?.response?.status === 403
        ? 'Espace réservé aux membres de la classe.'
        : 'Impossible de charger la discussion.');
    }
  }, [niveauId, isOnline]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!niveauId) {
    return <View style={styles.center}><Text style={styles.muted}>Aucune classe ne vous est associée.</Text></View>;
  }
  if (!isOnline) {
    return <View style={styles.center}><Text style={styles.muted}>Connecte-toi à internet pour accéder à la discussion de classe.</Text></View>;
  }
  if (err) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{err}</Text>
        <TouchableOpacity style={styles.btnRed} onPress={load}><Text style={styles.btnRedText}>Réessayer</Text></TouchableOpacity>
      </View>
    );
  }
  if (!data) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>;
  }

  const { schedule, messages, is_moderator, classe, ttl_days, members = [], members_count = 0 } = data;

  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await client.post(`/classes/${niveauId}/messages`, { contenu: text.trim() });
      setText('');
      await load();
    } catch (_) { Alert.alert('Erreur', 'Message non envoyé.'); }
    finally { setBusy(false); }
  }

  function confirmDelete(id) {
    Alert.alert('Supprimer', 'Supprimer ce message ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await client.delete(`/class-messages/${id}`); await load(); }
        catch (_) { Alert.alert('Erreur', 'Suppression impossible.'); }
      } },
    ]);
  }

  async function uploadSchedule() {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (res.canceled) return;
      const f = res.assets?.[0];
      if (!f) return;
      setSchedBusy(true);
      const fd = new FormData();
      fd.append('fichier', { uri: f.uri, name: f.name || 'emploi-du-temps', type: f.mimeType || 'application/octet-stream' });
      await client.post(`/classes/${niveauId}/schedule`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await load();
    } catch (_) { Alert.alert('Erreur', 'Téléversement impossible.'); }
    finally { setSchedBusy(false); }
  }

  function removeSchedule() {
    Alert.alert('Supprimer', "Supprimer l'emploi du temps ?", [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await client.delete(`/classes/${niveauId}/schedule`); await load(); } catch (_) {}
      } },
    ]);
  }

  return (
    <KeyboardAvoidingView style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.titleRow}>
          <Text style={styles.title}>Ma classe — {classe?.filiere?.code} · {classe?.niveau}</Text>
          <TouchableOpacity style={styles.membersBtn} onPress={() => setShowMembers((s) => !s)}>
            <Text style={styles.membersBtnText}>👥 {members_count}</Text>
          </TouchableOpacity>
        </View>

        {showMembers && (
          <View style={styles.membersCard}>
            <Text style={styles.membersTitle}>Membres de la classe ({members_count})</Text>
            <Text style={styles.membersHint}>Vérifiez qu'aucun compte inconnu n'a été ajouté.</Text>
            {members.map((mb) => (
              <View key={mb.id} style={styles.memberRow}>
                <Avatar name={mb.name} size={28} bg={colors.navy} />
                <Text style={styles.memberName}>
                  {mb.name}{mb.role === 'delegue' ? '  · délégué' : ''}{mb.id === user.id ? '  · vous' : ''}
                </Text>
                {!!mb.created_at && (
                  <Text style={styles.memberDate}>{new Date(mb.created_at).toLocaleDateString('fr-FR')}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Emploi du temps épinglé */}
        <View style={styles.pinned}>
          <Text style={styles.pinnedHead}>📌 {schedule?.titre || 'Emploi du temps'}</Text>
          {schedule ? (
            <>
              {!!schedule.description && <Text style={styles.muted}>{schedule.description}</Text>}
              {!!schedule.url_fichier && (
                <TouchableOpacity style={styles.btnRed} onPress={() => navigation.navigate('EchangesPreview', {
                  remoteUrl: schedule.url_fichier, type: schedule.type_fichier, titre: schedule.titre || 'Emploi du temps',
                })}>
                  <Text style={styles.btnRedText}>📅 Ouvrir l'emploi du temps</Text>
                </TouchableOpacity>
              )}
              {!!schedule.type_fichier && (
                <Text style={styles.metaSmall}>{labelForType(schedule.type_fichier)} · {formatSize(schedule.taille_fichier)}</Text>
              )}
            </>
          ) : (
            <Text style={styles.muted}>Aucun emploi du temps publié.</Text>
          )}

          {is_moderator && (
            <View style={styles.modRow}>
              <TouchableOpacity style={styles.btnNavy} onPress={uploadSchedule} disabled={schedBusy}>
                {schedBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnNavyText}>{schedule ? 'Mettre à jour' : 'Publier le fichier'}</Text>}
              </TouchableOpacity>
              {schedule && (
                <TouchableOpacity onPress={removeSchedule}><Text style={styles.removeLink}>Supprimer</Text></TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <Text style={styles.hint}>💬 Les messages disparaissent après {ttl_days} jours.</Text>

        {messages.length === 0 && <Text style={styles.muted}>Aucun message. Lancez la discussion !</Text>}
        {messages.map((m) => {
          const mine = m.user_id === user.id;
          const canDel = mine || is_moderator;
          return (
            <View key={m.id} style={[styles.msgRow, mine && styles.msgRowMine]}>
              <Avatar name={m.auteur?.name} size={32} bg={colors.navy} />
              <View style={[styles.bubble, mine && styles.bubbleMine, highlightId === m.id && styles.bubbleHi]}>
                <Text style={styles.msgAuthor}>
                  {m.auteur?.name}{m.auteur?.role === 'delegue' ? '  · délégué' : ''}
                </Text>
                <Text style={styles.msgText}>{m.contenu}</Text>
                {canDel && (
                  <TouchableOpacity onPress={() => confirmDelete(m.id)}>
                    <Text style={styles.msgDel}>Supprimer</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput style={styles.input} value={text} onChangeText={setText}
                   placeholder="Écrire un message…" placeholderTextColor={colors.textLight} multiline />
        <TouchableOpacity style={[styles.send, busy && styles.disabled]} onPress={send} disabled={busy}>
          <Text style={styles.sendText}>Envoyer</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  content: { padding: 14, paddingBottom: 20 },
  title: { fontSize: 18, fontWeight: '900', color: colors.navy, flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  membersBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  membersBtnText: { color: colors.navy, fontWeight: '800', fontSize: 13 },
  membersCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  membersTitle: { fontWeight: '800', color: colors.navy, fontSize: 14 },
  membersHint: { color: colors.textMuted, fontSize: 12, marginBottom: 8 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7,
    borderTopWidth: 1, borderTopColor: colors.border },
  memberName: { flex: 1, color: colors.navy, fontWeight: '600', fontSize: 14 },
  memberDate: { color: colors.textLight, fontSize: 11 },
  pinned: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.red },
  pinnedHead: { fontSize: 15, fontWeight: '800', color: colors.navy, marginBottom: 6 },
  muted: { color: colors.textMuted, fontSize: 14 },
  metaSmall: { color: colors.textLight, fontSize: 12, marginTop: 6 },
  btnRed: { backgroundColor: colors.red, borderRadius: radius.sm, paddingVertical: 11, alignItems: 'center', marginTop: 10 },
  btnRedText: { color: '#fff', fontWeight: '800' },
  btnNavy: { backgroundColor: colors.navy, borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  btnNavyText: { color: '#fff', fontWeight: '700' },
  modRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  removeLink: { color: colors.red, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 13, marginVertical: 14 },
  msgRow: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'flex-start' },
  msgRowMine: { flexDirection: 'row-reverse' },
  bubble: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 10, maxWidth: '80%' },
  bubbleMine: { backgroundColor: colors.salmon, borderColor: colors.salmonStrong || colors.salmon },
  bubbleHi: { borderColor: colors.red, borderWidth: 2 },
  msgAuthor: { fontSize: 12, fontWeight: '800', color: colors.navy, marginBottom: 2 },
  msgText: { fontSize: 15, color: colors.text },
  msgDel: { color: colors.red, fontSize: 11, fontWeight: '700', marginTop: 4 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 9, color: colors.text, maxHeight: 110 },
  send: { backgroundColor: colors.red, borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 11 },
  sendText: { color: '#fff', fontWeight: '800' },
  disabled: { opacity: 0.5 },
});
