import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import OfflineBanner from '../components/OfflineBanner';
import client from '../api/client';
import { colors, radius, colorForFiliere } from '../theme';

// Publication par l'ADMIN : on peut viser PLUSIEURS matières/filières à la fois
// (classes partageant un même cours).
export default function AdminPublishScreen() {
  const [filieres, setFilieres] = useState([]);
  const [selected, setSelected] = useState([]);   // matiere_id[]
  const [q, setQ] = useState('');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    client.get('/filieres').then(({ data }) => setFilieres(data.data || [])).catch(() => {});
  }, []);

  const matieres = useMemo(() => {
    const out = [];
    for (const f of filieres) {
      for (const n of f.niveaux || []) {
        for (const m of n.matieres || []) {
          out.push({ id: m.id, nom: m.nom, niveau: n.nom, filiere: f });
        }
      }
    }
    return out;
  }, [filieres]);

  const shown = useMemo(() => {
    if (!q) return matieres;
    const s = q.toLowerCase();
    return matieres.filter((m) =>
      `${m.filiere.code} ${m.filiere.nom} ${m.niveau} ${m.nom}`.toLowerCase().includes(s));
  }, [matieres, q]);

  // Une fois une 1re matière choisie, on verrouille le niveau : seules les classes
  // du MÊME niveau peuvent être ajoutées (seules elles partagent un cours commun).
  const lockedNiveau = useMemo(() => {
    if (selected.length === 0) return null;
    return matieres.find((m) => m.id === selected[0])?.niveau || null;
  }, [selected, matieres]);

  function toggle(id) {
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  async function pickFile() {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!res.canceled) setFile(res.assets?.[0] || null);
    } catch (_) { Alert.alert('Erreur', 'Sélection du fichier impossible.'); }
  }

  async function publish() {
    if (selected.length === 0 || !titre.trim() || !file) {
      return Alert.alert('Champs requis', 'Choisis au moins une matière, un titre et un fichier.');
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('titre', titre.trim());
      fd.append('description', description);
      selected.forEach((id) => fd.append('matiere_ids[]', String(id)));
      fd.append('fichier', { uri: file.uri, name: file.name || 'fichier', type: file.mimeType || 'application/octet-stream' });
      const { data } = await client.post('/admin/ressources', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Publié', `Ressource publiée dans ${data.count || selected.length} classe(s).`);
      setTitre(''); setDescription(''); setFile(null); setSelected([]); setQ('');
    } catch (e) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Publication impossible.');
    } finally { setBusy(false); }
  }

  return (
    <View style={styles.flex}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Publier une ressource</Text>

        <Text style={styles.label}>Titre</Text>
        <TextInput style={styles.input} value={titre} onChangeText={setTitre}
                   placeholder="Titre de la ressource" placeholderTextColor={colors.textLight} />

        <Text style={styles.label}>Description (optionnelle)</Text>
        <TextInput style={[styles.input, { height: 70 }]} value={description} onChangeText={setDescription} multiline />

        <Text style={styles.label}>
          Filières / classes destinataires{selected.length > 0 ? ` — ${selected.length} choisie(s)` : ''}
        </Text>
        <TextInput style={styles.input} value={q} onChangeText={setQ}
                   placeholder="Filtrer par filière, niveau, matière…" placeholderTextColor={colors.textLight} />
        {lockedNiveau && (
          <Text style={styles.hint}>
            Seules les classes de niveau « {lockedNiveau} » sont sélectionnables (cours communs).
          </Text>
        )}

        <ScrollView style={styles.listBox} nestedScrollEnabled keyboardShouldPersistTaps="handled">
          {shown.length === 0 ? (
            <Text style={styles.muted}>Aucune matière.</Text>
          ) : shown.map((m) => {
            const on = selected.includes(m.id);
            const disabled = lockedNiveau && m.niveau !== lockedNiveau;
            return (
              <TouchableOpacity key={m.id} disabled={disabled}
                style={[styles.optRow, disabled && styles.optRowDisabled]} onPress={() => toggle(m.id)}>
                <View style={[styles.check, on && styles.checkOn]}>
                  {on && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <View style={[styles.dot, { backgroundColor: m.filiere.couleur || colorForFiliere(m.filiere.code) }]} />
                <Text style={styles.optText} numberOfLines={1}>
                  {m.filiere.code} · {m.niveau} · {m.nom}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.label}>Fichier</Text>
        <TouchableOpacity style={styles.fileBtn} onPress={pickFile}>
          <Text style={styles.fileBtnText}>{file ? `📎 ${file.name}` : '＋ Choisir un fichier'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.publish} onPress={publish} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.publishText}>Publier{selected.length > 1 ? ` (${selected.length} classes)` : ''}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '900', color: colors.navy, marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '700', color: colors.navy, marginTop: 14, marginBottom: 4 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 15,
  },
  listBox: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, marginTop: 8,
    backgroundColor: colors.surface, maxHeight: 320,
  },
  muted: { color: colors.textMuted, padding: 14 },
  hint: { fontSize: 11.5, color: colors.textMuted, marginTop: 6, fontStyle: 'italic' },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderBottomWidth: 1, borderBottomColor: '#EEF1F4' },
  optRowDisabled: { opacity: 0.32 },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.red, borderColor: colors.red },
  checkMark: { color: '#fff', fontWeight: '900', fontSize: 13 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  optText: { flex: 1, color: colors.text },
  fileBtn: { borderWidth: 1.5, borderColor: colors.navy, borderStyle: 'dashed', borderRadius: radius.sm, padding: 14, alignItems: 'center' },
  fileBtnText: { color: colors.navy, fontWeight: '700' },
  publish: { backgroundColor: colors.red, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center', marginTop: 22 },
  publishText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
