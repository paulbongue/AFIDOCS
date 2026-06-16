import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Alert, Linking, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';

import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import client from '../api/client';
import { colors, radius, colorForFiliere, labelForType, formatSize } from '../theme';

// Espace commun (interfilière) : annonces des admins/délégués + commentaires.
export default function Feed({ focusPost, focusTs }) {
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const navigation = useNavigation();

  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [filieres, setFilieres] = useState([]);
  const [highlightId, setHighlightId] = useState(null);

  // Arrivée depuis une notification : surligne la publication ciblée.
  useEffect(() => {
    if (!focusPost) return;
    setHighlightId(Number(focusPost));
    const t = setTimeout(() => setHighlightId(null), 2600);
    return () => clearTimeout(t);
  }, [focusPost, focusTs]);

  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [targets, setTargets] = useState([]);
  const [niveauId, setNiveauId] = useState(null);
  const [posting, setPosting] = useState(false);

  const [comment, setComment] = useState({});
  const [schedBusy, setSchedBusy] = useState(false);

  const load = useCallback(async () => {
    if (!isOnline) return;
    setErr(null);
    try {
      const { data } = await client.get('/feed');
      setData(data);
    } catch (e) {
      setErr('Impossible de charger les annonces.');
    }
  }, [isOnline]);

  useFocusEffect(useCallback(() => {
    load();
    if (isOnline) client.get('/filieres').then(({ data }) => setFilieres(data.data || [])).catch(() => {});
  }, [load, isOnline]));

  if (!isOnline) {
    return <View style={styles.center}><Text style={styles.muted}>Connecte-toi à internet pour voir les annonces.</Text></View>;
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

  const { posts, schedule, can_post, is_admin, ttl_days } = data;
  const singleFiliere = targets.length === 1 ? filieres.find((f) => f.id === targets[0]) : null;

  function toggleTarget(id) {
    setTargets((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
    setNiveauId(null);
  }

  async function pickImage() {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
      if (!res.canceled) setImage(res.assets?.[0] || null);
    } catch (_) { Alert.alert('Erreur', 'Sélection de la photo impossible.'); }
  }

  async function submitPost() {
    if (!text.trim() && !image) return;
    setPosting(true);
    try {
      const fd = new FormData();
      if (text.trim()) fd.append('contenu', text.trim());
      if (image) fd.append('image', { uri: image.uri, name: image.name || 'photo.jpg', type: image.mimeType || 'image/jpeg' });
      targets.forEach((id) => fd.append('target_filiere_ids[]', String(id)));
      if (niveauId) fd.append('target_niveau_id', String(niveauId));
      await client.post('/feed/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setText(''); setImage(null); setTargets([]); setNiveauId(null);
      await load();
    } catch (e) {
      const st = e?.response?.status;
      const msg = st === 413 ? 'Photo trop volumineuse pour le serveur.'
        : e?.response?.data?.message || `Publication impossible${st ? ` (erreur ${st})` : ''}.`;
      Alert.alert('Erreur', msg);
    } finally { setPosting(false); }
  }

  function confirmDeletePost(id) {
    Alert.alert('Supprimer', 'Supprimer cette publication ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await client.delete(`/feed/posts/${id}`); await load(); } catch (_) {}
      } },
    ]);
  }

  async function sendComment(postId) {
    const c = (comment[postId] || '').trim();
    if (!c) return;
    try {
      await client.post(`/feed/posts/${postId}/comments`, { contenu: c });
      setComment((s) => ({ ...s, [postId]: '' }));
      await load();
    } catch (_) { Alert.alert('Erreur', 'Commentaire non envoyé.'); }
  }

  function confirmDeleteComment(id) {
    Alert.alert('Supprimer', 'Supprimer ce commentaire ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await client.delete(`/feed/comments/${id}`); await load(); } catch (_) {}
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
      await client.post('/feed/schedule', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await load();
    } catch (_) { Alert.alert('Erreur', 'Téléversement impossible.'); }
    finally { setSchedBusy(false); }
  }

  function removeSchedule() {
    Alert.alert('Supprimer', "Supprimer l'emploi du temps ?", [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await client.delete('/feed/schedule'); await load(); } catch (_) {}
      } },
    ]);
  }

  return (
    <KeyboardAvoidingView style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Annonces</Text>

        {/* Emploi du temps général épinglé */}
        <View style={styles.pinned}>
          <Text style={styles.pinnedHead}>📌 {schedule?.titre || 'Emploi du temps général'}</Text>
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
          {is_admin && (
            <View style={styles.modRow}>
              <TouchableOpacity style={styles.btnNavy} onPress={uploadSchedule} disabled={schedBusy}>
                {schedBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnNavyText}>{schedule ? 'Mettre à jour' : 'Publier le fichier'}</Text>}
              </TouchableOpacity>
              {schedule && <TouchableOpacity onPress={removeSchedule}><Text style={styles.removeLink}>Supprimer</Text></TouchableOpacity>}
            </View>
          )}
        </View>

        {/* Composer (admin + délégué) */}
        {can_post && (
          <View style={styles.composerCard}>
            <TextInput style={styles.area} value={text} onChangeText={setText}
                       placeholder="Partager une information…" placeholderTextColor={colors.textLight} multiline />
            {!!image && (
              <View style={styles.prevWrap}>
                <Image source={{ uri: image.uri }} style={styles.prevImg} />
                <TouchableOpacity onPress={() => setImage(null)}><Text style={styles.removeLink}>Retirer la photo</Text></TouchableOpacity>
              </View>
            )}
            <Text style={styles.smallLabel}>Cibler des filières (optionnel) :</Text>
            <View style={styles.chips}>
              {filieres.map((f) => {
                const c = f.couleur || colorForFiliere(f.code);
                const on = targets.includes(f.id);
                return (
                  <TouchableOpacity key={f.id} onPress={() => toggleTarget(f.id)}
                    style={[styles.chip, { borderColor: c }, on && { backgroundColor: c }]}>
                    <Text style={[styles.chipText, { color: on ? '#fff' : c }]}>{f.code}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {singleFiliere?.niveaux?.length > 0 && (
              <View style={styles.chips}>
                <TouchableOpacity style={[styles.chipN, !niveauId && styles.chipNOn]} onPress={() => setNiveauId(null)}>
                  <Text style={[styles.chipNText, !niveauId && styles.chipNTextOn]}>Tous niveaux</Text>
                </TouchableOpacity>
                {singleFiliere.niveaux.map((n) => (
                  <TouchableOpacity key={n.id} style={[styles.chipN, niveauId === n.id && styles.chipNOn]} onPress={() => setNiveauId(n.id)}>
                    <Text style={[styles.chipNText, niveauId === n.id && styles.chipNTextOn]}>{n.nom}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.composerActions}>
              <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                <Text style={styles.photoBtnText}>📷 Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnRed, { flex: 1, marginTop: 0 }]} onPress={submitPost} disabled={posting}>
                {posting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnRedText}>Publier</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles.hint}>Les publications disparaissent après {ttl_days} jours.</Text>

        {posts.length === 0 && <Text style={styles.muted}>Aucune publication pour le moment.</Text>}
        {posts.map((p) => (
          <View key={p.id} style={[styles.post, highlightId === p.id && styles.postHi]}>
            <View style={styles.postHead}>
              <Avatar name={p.auteur?.name} size={36} bg={colors.navy} />
              <View style={{ flex: 1 }}>
                <Text style={styles.postAuthor}>{p.auteur?.name} {p.auteur?.role ? `· ${p.auteur.role}` : ''}</Text>
                <Text style={styles.postDate}>{new Date(p.created_at).toLocaleString('fr-FR')}</Text>
              </View>
              {(is_admin || p.user_id === user.id) && (
                <TouchableOpacity onPress={() => confirmDeletePost(p.id)}><Text style={styles.removeLink}>Suppr.</Text></TouchableOpacity>
              )}
            </View>

            {(p.filieres?.length > 0 || p.target_niveau) && (
              <View style={styles.chips}>
                {p.filieres.map((f) => (
                  <View key={f.id} style={[styles.chip, { backgroundColor: f.couleur || colorForFiliere(f.code), borderColor: 'transparent' }]}>
                    <Text style={[styles.chipText, { color: '#fff' }]}>{f.code}</Text>
                  </View>
                ))}
                {p.target_niveau && (
                  <View style={[styles.chip, { backgroundColor: colors.navy, borderColor: 'transparent' }]}>
                    <Text style={[styles.chipText, { color: '#fff' }]}>{p.target_niveau.nom}</Text>
                  </View>
                )}
              </View>
            )}

            {!!p.contenu && <Text style={styles.postText}>{p.contenu}</Text>}
            {!!p.image_url && <Image source={{ uri: p.image_url }} style={styles.postImg} resizeMode="cover" />}

            <View style={styles.commentsBox}>
              {(p.commentaires || []).map((c) => (
                <View key={c.id} style={styles.comment}>
                  <Avatar name={c.auteur?.name} size={26} bg={colors.navy} />
                  <Text style={styles.commentText}><Text style={styles.commentAuthor}>{c.auteur?.name} </Text>{c.contenu}</Text>
                  {(is_admin || c.user_id === user.id) && (
                    <TouchableOpacity onPress={() => confirmDeleteComment(c.id)}><Text style={styles.cDel}>×</Text></TouchableOpacity>
                  )}
                </View>
              ))}
              <View style={styles.commentComposer}>
                <TextInput style={styles.commentInput} value={comment[p.id] || ''}
                           onChangeText={(v) => setComment((s) => ({ ...s, [p.id]: v }))}
                           placeholder="Commenter…" placeholderTextColor={colors.textLight} />
                <TouchableOpacity onPress={() => sendComment(p.id)}><Text style={styles.cSend}>Envoyer</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  content: { padding: 14, paddingBottom: 24 },
  title: { fontSize: 18, fontWeight: '900', color: colors.navy, marginBottom: 12 },
  muted: { color: colors.textMuted, fontSize: 14 },
  metaSmall: { color: colors.textLight, fontSize: 12, marginTop: 6 },
  pinned: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.red },
  pinnedHead: { fontSize: 15, fontWeight: '800', color: colors.navy, marginBottom: 6 },
  btnRed: { backgroundColor: colors.red, borderRadius: radius.sm, paddingVertical: 11, alignItems: 'center', marginTop: 10 },
  btnRedText: { color: '#fff', fontWeight: '800' },
  btnNavy: { backgroundColor: colors.navy, borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  btnNavyText: { color: '#fff', fontWeight: '700' },
  modRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  removeLink: { color: colors.red, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 13, marginVertical: 14 },
  composerCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.border, marginTop: 14 },
  area: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.text, minHeight: 70, textAlignVertical: 'top' },
  prevWrap: { marginTop: 10 },
  prevImg: { width: '100%', height: 180, borderRadius: radius.sm, marginBottom: 6 },
  smallLabel: { color: colors.textMuted, fontSize: 13, marginTop: 12, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5 },
  chipText: { fontWeight: '800', fontSize: 12 },
  chipN: { borderWidth: 1, borderColor: colors.navy, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#fff' },
  chipNOn: { backgroundColor: colors.navy },
  chipNText: { color: colors.navy, fontWeight: '700', fontSize: 12 },
  chipNTextOn: { color: '#fff' },
  composerActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  photoBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 11 },
  photoBtnText: { color: colors.navy, fontWeight: '700' },
  post: { backgroundColor: colors.surface, border