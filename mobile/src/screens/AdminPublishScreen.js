import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import OfflineBanner from '../components/OfflineBanner';
import client from '../api/client';
import { colors, radius, colorForFiliere } from '../theme';

// Publication ADMIN simplifiée : accordéon Filière → Niveau → matières.
// Choix multiple, avec verrou de niveau (mêmes niveaux uniquement).
export default function AdminPublishScreen() {
  const [filieres, setFilieres] = useState([]);
  const [expanded, setExpanded] = useState({});   // { filiereId: bool }
  const [selected, setSelected] = useState([]);    // matiere_id[]
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    client.get('/filieres').then(({ data }) => setFilieres(data.data || [])).catch(() => {});
  }, []);

  const matInfo = useMemo(() => {
    const m = {};
    for (const f of filieres) for (const n of f.niveaux || []) for (const mat of n.matieres || []) {
      m[mat.id] = { niveauNom: n.nom };
    }
    return m;
  }, [filieres]);

  const lockedNiveau = selected.length ? matInfo[selected[0]]?.niveauNom : null;

  function toggle(id) {
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }
  function toggleFiliere(fid) {
    setExpanded((e) => ({ ...e, [fid]: !e[fid] }));
  }
  const countIn = (f) => (f.niveaux || []).reduce((s, n) =>
    s + (n.matieres || []).filter((m) => selected.includes(m.id)).length, 0);

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
      setTitre(''); setDescription(''); setFile(null); setSelected([]);
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
          Destinataires{selected.length > 0 ? ` — ${selected.length} matière(s)` : ''}
        </Text>
        {lockedNiveau && (
          <Text style={styles.hint}>Seules les classes de niveau « {lockedNiveau} » sont sélectionnables.</Text>
        )}

        <View style={styles.acc}>
          {filieres.map((f) => {
            const n = countIn(f);
            const open = !!expanded[f.id];
            return (
              <View key={f.id} style={styles.accItem}>
                <TouchableOpacity style={styles.accHead} onPress={() => toggleFiliere(f.id)}>
                  <View style={styles.accHeadLeft}>
                    <View style={[styles.dot, { backgroundColor: f.couleur || colorForFiliere(f.code) }]} />
                    <Text style={styles.accHeadNom} numberOfLines={1}>{f.code} · {f.nom}</Text>
                  </View>
                  <View style={styles.accHeadRight}>
                    {n > 0 && <View style={styles.accCount}><Text style={styles.accCountTxt}>{n}</Text></View>}
                    <Text style={styles.accChev}>{open ? '▾' : '▸'}</Text>
                  </View>
                </TouchableOpacity>

                {open && (f.niveaux || []).map((niv) => {
                  const disabled = lockedNiveau && niv.nom !== lockedNiveau;
                  return (
                    <View key={niv.id} style={[styles.accNiv, disabled && styles.accDisabled]}>
                      <Text style={styles.accNivTitle}>{niv.nom}</Text>
                      {(niv.matieres || []).map((m) => {
                        const on = selected.includes(m.id);
                        return (
                          <TouchableOpacity key={m.id} style={styles.matRow} disabled={disabled}
                                            onPress={() => toggle(m.id)}>
                            <View style={[styles.check, on && styles.checkOn]}>
                              {on && <Text style={styles.checkMark}>✓</Text>}
                            </View>
                            <Text style={styles.matTxt} numberOfLines={1}>{m.nom}</Text>
                          </TouchableOpacity>
                        );
                      })}
                      {(niv.matieres || []).length === 0 && <Text style={styles.muted}>Aucune matière.</Text>}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

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
  hint: { fontSize: 11.5, color: colors.textMuted, fontStyle: 'italic', marginBottom: 4 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 15,
  },
  acc: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, marginTop: 8, overflow: 'hidden' },
  accItem: { borderBottomWidth: 1, borderBottomColor: '#EEF1F4' },
  accHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: colors.surface },
  accHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  accHeadRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accHeadNom: { fontWeight: '800', color: colors.navy, flex: 1 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  accCount: { backgroundColor: colors.red, borderRadius: 999, minWidth: 20, height: 20, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  accCountTxt: { color: '#fff', fontWeight: '800', fontSize: 11 },
  accChev: { color: colors.textMuted, fontSize: 12 },
  accNiv: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F5F7FA', borderTopWidth: 1, borderTopColor: '#E6EAF0' },
  accDisabled: { opacity: 0.4 },
  accNivTitle: { fontSize: 11.5, fontWeight: '800', color: colors.navy, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  matRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.red, borderColor: colors.red },
  checkMark: { color: '#fff', fontWeight: '900', fontSize: 13 },
  matTxt: { flex: 1, color: colors.text },
  muted: { color: colors.textMuted, fontSize: 13 },
  fileBtn: { borderWidth: 1.5, borderColor: colors.navy, borderStyle: 'dashed', borderRadius: radius.sm, padding: 14, alignItems: 'center' },
  fileBtnText: { color: colors.navy, fontWeight: '700' },
  publish: { backgroundColor: colors.red, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center', marginTop: 22 },
  publishText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
