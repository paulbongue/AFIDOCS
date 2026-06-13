import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
  TextInput, Alert, Linking, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import OfflineBanner from '../components/OfflineBanner';
import Avatar from '../components/Avatar';
import { useNetwork } from '../context/NetworkContext';
import { useAuth } from '../context/AuthContext';
import client, { recordActivity } from '../api/client';
import * as dbApi from '../db/database';
import { downloadRessource, removeDownload, reachableFileUrl } from '../services/sync';
import { colors, radius, labelForType, formatSize } from '../theme';

export default function ResourceDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { isOnline } = useNetwork();
  const { user } = useAuth();

  const [ressource, setRessource] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Édition (réservée à l'auteur délégué ou à l'admin, en ligne).
  const [authorId, setAuthorId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [eTitre, setETitre] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eFile, setEFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setRessource(await dbApi.getRessource(id, user?.id));
    setComments(await dbApi.getComments(id));

    if (isOnline) {
      try {
        const { data } = await client.get(`/ressources/${id}`);
        const r = data.data;
        setAuthorId(r.user_id ?? null);
        await dbApi.upsertRessources([r]);
        await dbApi.saveComments(id, r.commentaires || []);
        setRessource(await dbApi.getRessource(id, user?.id));
        setComments(await dbApi.getComments(id));
      } catch (_) { /* cache */ }
    }
  }, [id, isOnline]);

  useEffect(() => { load(); }, [load]);

  // Trace une consultation (une fois par ressource ouverte, en ligne) — hors admin.
  useEffect(() => {
    if (isOnline && user && user.role !== 'admin') recordActivity('view', Number(id));
  }, [id, isOnline, user]);

  async function handleDownload() {
    if (!isOnline) return Alert.alert('Hors-ligne', 'Connecte-toi à internet pour télécharger.');
    setDownloading(true);
    try {
      await downloadRessource(user?.id, ressource);
      recordActivity('download', Number(id));
      setRessource(await dbApi.getRessource(id, user?.id));
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

  // Aperçu IN-APP : visionneuse intégrée (fichier local si déjà téléchargé,
  // sinon depuis le serveur).
  function handlePreview() {
    const remote = reachableFileUrl(ressource.url_fichier);
    if (!ressource.local_uri && !remote) return Alert.alert('Indisponible', 'Aucun fichier à prévisualiser.');
    if (!ressource.local_uri && !isOnline) {
      return Alert.alert('Hors-ligne', "Connecte-toi à internet, ou télécharge le fichier pour l'aperçu hors-ligne.");
    }
    navigation.navigate('RessourcePreview', {
      remoteUrl: remote, localUri: ressource.local_uri,
      type: ressource.type_fichier, titre: ressource.titre,
    });
  }

  async function handleRemove() {
    await removeDownload(user?.id, ressource);
    setRessource(await dbApi.getRessource(id, user?.id));
  }

  function startEdit() {
    setETitre(ressource.titre || '');
    setEDesc(ressource.description || '');
    setEFile(null);
    setEditing(true);
  }

  async function pickNewFile() {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!res.canceled) setEFile(res.assets?.[0] || null);
    } catch (_) { Alert.alert('Erreur', 'Sélection du fichier impossible.'); }
  }

  async function saveEdit() {
    if (!eTitre.trim()) return Alert.alert('Titre requis', 'Le titre ne peut pas être vide.');
    if (!isOnline) return Alert.alert('Hors-ligne', 'Connecte-toi à internet pour enregistrer.');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('_method', 'PUT'); // method spoofing pour l'envoi multipart
      fd.append('titre', eTitre.trim());
      fd.append('description', eDesc);
      if (eFile) {
        fd.append('fichier', { uri: eFile.uri, name: eFile.name || 'fichier', type: eFile.mimeType || 'application/octet-stream' });
      }
      const url = user?.role === 'admin' ? `/admin/ressources/${id}` : `/ressources/${id}`;
      await client.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setEditing(false);
      await load();
      Alert.alert('Modifié', 'La ressource a été mise à jour.');
    } catch (e) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Modification impossible.');
    } finally { setSaving(false); }
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

  function confirmDeleteComment(c) {
    if (!isOnline) return Alert.alert('Hors-ligne', 'Connecte-toi à internet pour supprimer.');
    Alert.alert('Supprimer', 'Supprimer ce commentaire ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try { await client.delete(`/commentaires/${c.id}`); await load(); }
          catch (_) { Alert.alert('Erreur', 'Suppression impossible.'); }
        },
      },
    ]);
  }

  if (!ressource) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>;
  }

  const isOffline = !!ressource.local_uri;
  const accent = ressource.filiere_couleur || colors.navy;
  const canEdit = user?.role === 'admin'
    || (user?.role === 'delegue' && authorId != null && String(authorId) === String(user?.id));

  return (
    <KeyboardAvoidingView style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
            {user?.role !== 'admin' && (
              isOffline ? (
                <TouchableOpacity style={styles.btnRed} onPress={handleOpen} activeOpacity={0.85}>
                  <Text style={styles.btnRedText}>📂  Ouvrir le fichier</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.btnRed} onPress={handleDownload} disabled={downloading} activeOpacity={0.85}>
                  {downloading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnRedText}>⬇  Télécharger</Text>}
                </TouchableOpacity>
              )
            )}

            <TouchableOpacity style={styles.btnOutline} onPress={handlePreview} activeOpacity={0.85}>
              <Text style={styles.btnOutlineText}>👁  Aperçu / Ouvrir en ligne</Text>
            </TouchableOpacity>
          </View>
          {isOffline && (
            <TouchableOpacity onPress={handleRemove}>
              <Text style={styles.remove}>Retirer du hors-ligne</Text>
            </TouchableOpacity>
          )}
          {canEdit && !editing && (
            <TouchableOpacity style={styles.btnOutline} onPress={startEdit} activeOpacity={0.85}>
              <Text style={styles.btnOutlineText}>✏️  Modifier la ressource</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Formulaire d'édition (titre / description / remplacement de fichier) */}
        {editing && (
          <View style={styles.editCard}>
            <Text style={styles.editTitle}>Modifier la ressource</Text>
            <Text style={styles.editLbl}>Titre</Text>
            <TextInput style={styles.editInput} value={eTitre} onChangeText={setETitre}
                       placeholder="Titre" placeholderTextColor={colors.textLight} />
            <Text style={styles.editLbl}>Description</Text>
            <TextInput style={[styles.editInput, { height: 80 }]} value={eDesc} onChangeText={setEDesc}
                       multiline placeholder="Description" placeholderTextColor={colors.textLight} />
            <TouchableOpacity style={styles.fileBtn} onPress={pickNewFile}>
              <Text style={styles.fileBtnText}>{eFile ? `📎 ${eFile.name}` : '＋ Remplacer le fichier (optionnel)'}</Text>
            </TouchableOpacity>
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.btnRed} onPress={saveEdit} disabled={saving} activeOpacity={0.85}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnRedText}>Enregistrer</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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

        {comments.map((c) => {
          const canDelete = String(c.user_id) === String(user?.id) || user?.role === 'admin';
          return (
            <View key={String(c.id)} style={styles.comment}>
              <Avatar name={c.auteur_nom} size={34} bg={colors.navy} />
              <View style={styles.commentBody}>
                <Text style={styles.commentAuthor}>{c.auteur_nom}</Text>
                <Text style={styles.commentText}>{c.contenu}</Text>
                {canDelete && (
                  <TouchableOpacity onPress={() => confirmDeleteComment(c)}>
                    <Text style={styles.commentDelete}>Supprimer</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
        {comments.length === 0 && <Text style={styles.noComment}>Aucun commentaire pour le moment.</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
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
  btnOutline: { borderWidth: 1.5, borderColor: colors.navy, borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  btnOutlineText: { color: colors.navy, fontWeight: '700', fontSize: 14 },
  remove: { color: colors.red, textAlign: 'center', marginTop: 12, fontWeight: '600' },
  editCard: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, marginTop: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  editTitle: { fontSize: 16, fontWeight: '900', color: colors.navy, marginBottom: 8 },
  editLbl: { fontSize: 13, fontWeight: '700', color: colors.navy, marginTop: 10, marginBottom: 4 },
  editInput: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 15,
  },
  fileBtn: {
    borderWidth: 1.5, borderColor: colors.navy, borderStyle: 'dashed', borderRadius: radius.sm,
    padding: 12, alignItems: 'center', marginTop: 12,
  },
  fileBtnText: { color: colors.navy, fontWeight: '700' },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 14, alignItems: 'center' },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  cancelText: { color: colors.textMuted, fontWeight: '700' },
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
  commentDelete: { color: colors.red, fontWeight: '700', fontSize: 12, marginTop: 6 },
  noComment: { color: colors.textMuted, marginTop: 10, fontStyle: 'italic' },
});
