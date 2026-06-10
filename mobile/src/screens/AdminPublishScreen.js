import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import OfflineBanner from '../components/OfflineBanner';
import client from '../api/client';
import { colors, radius, colorForFiliere } from '../theme';

// Publication par l'ADMIN : libre choix filière → niveau → matière.
export default function AdminPublishScreen() {
  const [filieres, setFilieres] = useState([]);
  const [fId, setFId] = useState(null);
  const [nId, setNId] = useState(null);
  const [matiereId, setMatiereId] = useState(null);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    client.get('/filieres').then(({ data }) => setFilieres(data.data || [])).catch(() => {});
  }, []);

  const niveaux = useMemo(() => filieres.find((x) => x.id === fId)?.niveaux || [], [filieres, fId]);
  const matieres = useMemo(() => niveaux.find((x) => x.id === nId)?.matieres || [], [niveaux, nId]);

  async function pickFile() {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!res.canceled) setFile(res.assets?.[0] || null);
    } catch (_) { Alert.alert('Erreur', 'Sélection du fichier impossible.'); }
  }

  async function publish() {
    if (!matiereId || !titre.trim() || !file) {
      return Alert.alert('Champs requis', 'Filière, niveau, matière, titre et fichier sont obligatoires.');
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('titre', titre.trim());
      fd.append('description', description);
      fd.append('matiere_id', String(matiereId));
      fd.append('fichier', { uri: file.uri, name: file.name || 'fichier', type: file.mimeType || 'application/octet-stream' });
      await client.post('/admin/ressources', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Publié', 'Ressource publiée.');
      setTitre(''); setDescription(''); setFile(null); setMatiereId(null); setNId(null); setFId(null);
    } catch (e) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Publication impossible.');
    } finally { setBusy(false); }
  }

  return (
    <View style={styles.flex}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Publier une ressource</Text>

        <Text style={styles.label}>Filière</Text>
        <Chips items={filieres.map((f) => ({ id: f.id, label: f.code, color: f.couleur || colorForFiliere(f.code) }))}
               value={fId} onSelect={(id) => { setFId(id); setNId(null); setMatiereId(null); }} />

        {fId != null && (
          <>
            <Text style={styles.label}>Niveau</Text>
            <Chips items={niveaux.map((n) => ({ id: n.id, label: n.nom, color: colors.navy }))}
                   value={nId} onSelect={(id) => { setNId(id); setMatiereId(null); }} />
          </>
        )}

        {nId != null && (
          <>
            <Text style={styles.label}>Matière</Text>
            {matieres.map((m) => (
              <TouchableOpacity key={m.id} style={[styles.option, matiereId === m.id && styles.optionActive]}
                                onPress={() => setMatiereId(m.id)}>
                <Text style={[styles.optionText, matiereId === m.id && styles.optionTextActive]}>{m.nom}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <Text style={styles.label}>Titre</Text>
        <TextInput style={styles.input} value={titre} onChangeText={setTitre}
                   placeholder="Titre de la ressource" placeholderTextColor={colors.textLight} />

        <Text style={styles.label}>Description (optionnelle)</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={description} onChangeText={setDescription} multiline />

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

function Chips({ items, value, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
      {items.map((it) => {
        const active = value === it.id;
        return (
          <TouchableOpacity key={it.id} onPress={() => onSelect(it.id)}
            style={[styles.chip, { borderColor: it.color }, active && { backgroundColor: it.color }]}>
            <Text style={[styles.chipText, { color: active ? '#fff' : it.color }]}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '900', color: colors.navy, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: colors.navy, marginTop: 14, marginBottom: 4 },
  chip: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  chipText: { fontWeight: '700', fontSize: 12 },
  option: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 11, marginBottom: 6,
  },
  optionActive: { borderColor: colors.red, backgroundColor: '#FCEEEA' },
  optionText: { color: colors.text },
  optionTextActive: { color: colors.red, fontWeight: '700' },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 15,
  },
  fileBtn: { borderWidth: 1.5, borderColor: colors.navy, borderStyle: 'dashed', borderRadius: radius.sm, padding: 14, alignItems: 'center' },
  fileBtnText: { color: colors.navy, fontWeight: '700' },
  publish: { backgroundColor: colors.red, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center', marginTop: 22 },
  publishText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
