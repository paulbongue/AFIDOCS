import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import OfflineBanner from '../components/OfflineBanner';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import client from '../api/client';
import { colors, radius } from '../theme';

// Publication directe par le délégué — limitée à SA CLASSE (niveau).
export default function PublishScreen({ navigation }) {
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const [filiere, setFiliere] = useState(null);
  const [niveau, setNiveau] = useState(null);
  const [matiereId, setMatiereId] = useState(null);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState([]);

  useEffect(() => {
    if (!isOnline) return;
    client.get('/filieres').then(({ data }) => {
      const f = (data.data || []).find((x) => x.id === user?.filiere_id);
      setFiliere(f || null);
      setNiveau((f?.niveaux || []).find((n) => n.id === user?.niveau_id) || null);
    }).catch(() => {});
  }, [user, isOnline]);

  async function loadMine() {
    try {
      const { data } = await client.get('/ressources');
      setMine((data.data || []).filter((r) => r.user_id === user?.id));
    } catch (_) { /* ignore */ }
  }

  useEffect(() => { if (isOnline) loadMine(); }, [isOnline, user]); // eslint-disable-line

  function confirmDeleteMine(item) {
    Alert.alert('Supprimer', `Supprimer « ${item.titre} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try { await client.delete(`/ressources/${item.id}`); await loadMine(); }
          catch (_) { Alert.alert('Erreur', 'Suppression impossible.'); }
        },
      },
    ]);
  }

  const matieres = niveau?.matieres || [];

  async function pickFile() {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (res.canceled) return;
      setFile(res.assets?.[0] || null);
    } catch (_) {
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier.');
    }
  }

  async function publish() {
    if (!isOnline) return Alert.alert('Hors-ligne', 'Connecte-toi à internet pour publier.');
    if (!matiereId || !titre.trim() || !file) {
      return Alert.alert('Champs requis', 'Matière, titre et fichier sont obligatoires.');
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('titre', titre.trim());
      fd.append('description', description);
      fd.append('matiere_id', String(matiereId));
      fd.append('fichier', {
        uri: file.uri,
        name: file.name || 'fichier',
        type: file.mimeType || 'application/octet-stream',
      });
      await client.post('/ressources', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Publié', 'Ressource publiée et disponible immédiatement.');
      setTitre(''); setDescription(''); setFile(null); setMatiereId(null);
      loadMine();
    } catch (e) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Publication impossible.');
    } finally {
      setBusy(false);
    }
  }

  if (!user?.niveau_id) {
    return (
      <View style={styles.flex}>
        <OfflineBanner />
        <View style={styles.center}>
          <Text style={styles.info}>
            Aucune classe ne t'est assignée. Contacte l'administrateur pour être désigné
            délégué d'une classe avant de publier.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <Text style={styles.title}>Publier une ressource</Text>
          <TouchableOpacity style={styles.mineBtn} onPress={() => navigation.navigate('MesRessources')}>
            <Icon name="resources" size={14} color="#fff" />
            <Text style={styles.mineBtnText}>Mes ressources</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Ma classe (verrouillée)</Text>
        <View style={styles.locked}>
          <Text style={styles.lockedText}>
            {filiere && niveau ? `${filiere.code} · ${niveau.nom}` : 'Chargement…'}
          </Text>
        </View>

        <Text style={styles.label}>Matière</Text>
        {matieres.length === 0 ? (
          <Text style={styles.muted}>Chargement des matières…</Text>
        ) : matieres.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.option, matiereId === m.id && styles.optionActive]}
            onPress={() => setMatiereId(m.id)}
          >
            <Text style={[styles.optionText, matiereId === m.id && styles.optionTextActive]}>{m.nom}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Titre</Text>
        <TextInput style={styles.input} value={titre} onChangeText={setTitre}
                   placeholder="Ex : Cours chapitre 1" placeholderTextColor={colors.textLight} />

        <Text style={styles.label}>Description (optionnelle)</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={description} onChangeText={setDescription}
                   placeholder="Quelques mots…" placeholderTextColor={colors.textLight} multiline />

        <Text style={styles.label}>Fichier</Text>
        <TouchableOpacity style={styles.fileBtn} onPress={pickFile}>
          <Icon name={file ? 'attach' : 'plus'} size={16} color={colors.brandDark} />
          <Text style={styles.fileBtnText}>{file ? file.name : 'Choisir un fichier'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.publish} onPress={publish} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishText}>Publier</Text>}
        </TouchableOpacity>

        {/* Mes ressources publiées */}
        <Text style={[styles.title, { marginTop: 28, fontSize: 17 }]}>Mes ressources publiées ({mine.length})</Text>
        {mine.length === 0 ? (
          <Text style={styles.muted}>Vous n'avez encore rien publié.</Text>
        ) : mine.map((r) => (
          <View key={r.id} style={styles.mineRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.mineTitle} numberOfLines={1}>{r.titre}</Text>
              <Text style={styles.mineMeta} numberOfLines={1}>{r.matiere?.nom}</Text>
            </View>
            <TouchableOpacity style={styles.mineDel} onPress={() => confirmDeleteMine(r)}>
              <Icon name="trash" size={16} color={colors.brand} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  info: { color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '900', color: colors.text },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 10 },
  mineBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.brandDark, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  mineBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 14, marginBottom: 6 },
  muted: { color: colors.textMuted },
  mineRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: 12, marginTop: 8, borderWidth: 1, borderColor: colors.border,
  },
  mineTitle: { fontWeight: '800', color: colors.text },
  mineMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  mineDel: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  locked: { backgroundColor: colors.muted, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.border },
  lockedText: { color: colors.textMuted, fontWeight: '700' },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 11, color: colors.text, fontSize: 15,
  },
  option: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 11, marginBottom: 6,
  },
  optionActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  optionText: { color: colors.text },
  optionTextActive: { color: colors.brand, fontWeight: '700' },
  fileBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: colors.brandDark, borderStyle: 'dashed',
    borderRadius: radius