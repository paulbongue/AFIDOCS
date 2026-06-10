import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
  TextInput, Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';

import OfflineBanner from '../components/OfflineBanner';
import Avatar from '../components/Avatar';
import { useNetwork } from '../context/NetworkContext';
import client from '../api/client';
import * as dbApi from '../db/database';
import { downloadRessource, removeDownload } from '../services/sync';
import { colors, radius, labelForType, formatSize } from '../theme';

export default function ResourceDetailScreen({ route }) {
  const { id } = route.params;
  const { isOnline } = useNetwork();

  const [ressource, setRessource] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setRessource(await dbApi.getRessource(id));
    setComments(await dbApi.getComments(id));

    if (isOnline) {
      try {
        const { data } = await client.get(`/ressources/${id}`);
        const r = data.data;
        await dbApi.upsertRessources([r]);
        await dbApi.saveComments(id, r.commentaires || []);
        setRessource(await dbApi.getRessource(id));
        setComments(await dbApi.getComments(id));
      } catch (_) { /* cache */ }
    }
  }, [id, isOnline]);

  useEffect(() => { load(); }, [load]);

  async function handleDownload() {
    if (!isOnline) return Alert.alert('Hors-ligne', 'Connecte-toi à internet pour télécharger.');
    setDownloading(true);
    try {
      await downloadRessource(ressource);
      setRessource(await dbApi.getRessource(id));
      Alert.alert('Téléchargé', 'Ressource disponible hors-ligne.');
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Téléchargement impossible.');
    } finally { setDownloading(false); }
  }

  async function handleOpen() {
    if (!ressource?.local_uri) return;
    if (!(await Sharing.isAvailableAsync())) {
      return Alert.alert('Indisponible', "L'ouverture de fichier n'est pas disponible.");
    }
    await Sharing.shareAsync(ressource.local_uri);
  }

  async function handleRemove() {
    await removeDownload(ressource);
    setRessource(await dbApi.getRessource(id));
  }

  async function submitComment() {
    if (!newComment.trim()) return;
    if (!isOnline) return Alert.alert('Hors-ligne', 'Connecte-toi à internet pour commenter.');
    setBusy(true);
    try {
      await client.post(`/ressources/${id}/commentaires`, { contenu: newComment.trim() });
      setNewComment('');
      await load();
    } catch (_) {
      Alert.alert('Erreur', 'Commentaire non envoyé.');
    } finally { setBusy(false); }
  }

  if (!ressource) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>;
  }

  const isOffline = !!ressource.local_uri;
  const accent = ressource.filiere_couleur || colors.navy;

  return (
    <View style={styles.flex}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Fil d'Ariane */}
        <Text style={styles.breadcrumb}>
          <Text style={styles.crumb}>{ressource.filiere_code}</Text>
          <Text style={styles.sep}>  ›  </Text>
          <Text style={styles.crumb}>{ressource.niveau_nom}</Text>
          <Text style={styles.sep}>  ›  </Text>
          <Text style={styles.crumb}>{ressource.matiere_nom}</Text>
        </Text>

        {/* Carte d'information */}
        <View style={styles.infoCard}>
          <View style={styles.infoHead}>
            <View style={[styles.iconBox, { backgroundColor: accent }]}>
              <Text style={styles.iconType}>{labelForType(ressource.type_fichier)}</Text>
            </View>
            <Text style={styles.titre}>{ressource.titre}</Text>
          </View>
          <Text style={styles.meta}>
            {ressource.filiere_code} · {ressource.niveau_nom} · {ressource.matiere_nom} ·{' '}
            {labelForType(ressource.type_fichier)} · {formatSize(ressource.taille_fichier)}
          </Text>
          <Text style={styles.author}>Publié par {ressource.auteur_nom}</Text>
          {!!ressource.description && <Text style={styles.description}>{ressource.description}</Text>}

          <View style={styles.actions}>
            {isOffline ? (
              <TouchableOpacity style={styles.btnRed} onPress={handleOpen} activeOpacity={0.85}>
                <Text style={styles.btnRedText}>📂  Ouvrir le fichier</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.btnRed} onPress={handleDownload} disabled={downloading} activeOpacity={0.85}>
                {downloading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnRedText}>⬇  Télécharger</Text>}
              </TouchableOpacity>
            )}
          </View>
          {isOffline && (
            <TouchableOpacity onPress={handleRemove}>
              <Text style={styles.remove}>Retirer du hors-ligne</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Commentaires */}
        <Text style={styles.section}>Commentaires ({comments.length})</Text>

        <View style={styles.commentBox}>
          <TextInput
            style={styles.commentInput}
            value={newComment}
            onChangeText={setNewComment}
            placeholder={isOnline ? 'Laisser un commentaire…' : 'Hors-ligne : indisponible'}
            placeholderTextColor={colors.textLight}
            editable={isOnline}
            multiline
          />
          <TouchableOpacity
            style={[styles.send, (!isOnline || busy) && styles.disabled]}
            onPress={submitComment}
            disabled={!isOnline || busy}
          >
            <Text style={styles.sendText}>Envoyer</Text>
          </TouchableOpacity>
        </View>

        {comments.map((c) => (
          <View key={String(c.id)} style={styles.comment}>
            <Avatar name={c.auteur_nom} size={34} bg={colors.navy} />
            <View style={styles.commentBody}>
              <Text style={styles.commentAuthor}>{c.auteur_nom}</Text>
              <Text style={styles.commentText}>{c.contenu}</Text>
            </View>
          </View>
        ))}
        {comments.length === 0 && <Text style={styles.noComment}>Aucun commentaire pour le moment.</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { padding: 16 },
  breadcrumb: { marginBottom: 12, flexDirection: 'row', flexWrap: 'wrap' },
  crumb: { color: colors.red, fontWeight: '700', fontSize: 13 },
  sep: { color: colors.textLight, fontSize: 13 },
  infoCard: {
    backgroundColor: colors.cardGray, borderRadius: radius.md, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  infoHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconType: { color: '#fff', fontSize: 11, fontWeight: '800' },
  titre: { flex: 1, fontSize: 18, fontWeight: '900', color: colors.navy },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 12 },
  author: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  description: { fontSize: 15, color: colors.text, marginTop: 12, lineHeight: 22 },
  actions: { marginTop: 16 },
  btnRed: { backgroundColor: colors.red, borderRadius: radius.sm, paddingVertical: 13, alignItems: 'center' },
  btnRedText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  remove: { color: colors.red, textAlign: 'center', marginTop: 12, fontWeight: '600' },
  section: { fontSize: 16, fontWeight: '800', color: colors.navy, marginTop: 26, marginBottom: 12 },
  commentBox: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  commentInput: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, minHeight: 44,
  },
  send: { backgroundColor: colors.red, borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 12 },
  sendText: { color: '#fff', fontWeight: '800' },
  disabled: { opacity: 0.5 },
  comment: {
    flexDirection: 'row', gap: 10, backgroundColor: colors.surface, borderRadius: radius.md,
    padding: 12, marginTop: 10, borderWidth: 1, borderColor: colors.border,
  },
  commentBody: { flex: 1 },
  commentAuthor: { fontWeight: '800', color: colors.navy, fontSize: 13 },
  commentText: { color: colors.text, marginTop: 3, lineHeight: 20 },
  noComment: { color: colors.textMuted, marginTop: 10, fontStyle: 'italic' },
});
