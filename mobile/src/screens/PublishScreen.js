import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import OfflineBanner from '../components/OfflineBanner';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import client from '../api/client';
import { colors, radius } from '../theme';

// Publication directe par le délégué — limitée à SA CLASSE (niveau).
export default function PublishScreen() {
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const [filiere, setFiliere] = useState(null);
  const [niveau, setNiveau] = useState(null);
  const [matiereId, setMatiereId] = useState(null);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOnline) return;
    client.get('/filieres').then(({ data }) => {
      const f = (data.data || []).find((x) => x.id === user?.filiere_id);
      setFiliere(f || null);
      setNiveau((f?.niveaux || []).find((n) => n.id === user?.niveau_id) || null);
    }).catch(() => {});
  }, [user, isOnline]);

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
    <View style={styles.flex}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Publier une ressource</Text>

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
          <Text style={styles.fileBtnText}>{file ? `📎 ${file.name}` : '＋ Choisir un fichier'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.publish} onPress={publish} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishText}>Publier</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  info: { color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '900', color: colors.navy, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: colors.navy, marginTop: 14, marginBottom: 6 },
  muted: { color: colors.textMuted },
  locked: { backgroundColor: '#EDEDED', borderRadius: radius.sm, padding: 12, borderWidth: 1, borderColor: colors.border },
  lockedText: { color: colors.textMuted, fontWeight: '700' },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 15,
  },
  option: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 11, marginBottom: 6,
  },
  optionActive: { borderColor: colors.red, backgroundColor: '#FCEEEA' },
  optionText: { color: colors.text },
  optionTextActive: { color: colors.red, fontWeight: '700' },
  fileBtn: {
    borderWidth: 1.5, borderColor: colors.accent || colors.navy, borderStyle: 'dashed',
    borderRadius: radius.sm, padding: 14, alignItems: 'center',
  },
  fileBtnText: { color: colors.navy, fontWeight: '700' },
  publish: { backgroundColor: colors.red, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center', marginTop: 22 },
  publishText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
