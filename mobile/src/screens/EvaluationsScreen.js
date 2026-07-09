import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import OfflineBanner from '../components/OfflineBanner';
import Icon from '../components/Icon';
import client from '../api/client';
import { colors, radius } from '../theme';

// Évaluation des enseignants (étudiant/délégué) : liste des modules + grille /20.
export default function EvaluationsScreen() {
  const [modules, setModules] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [annee, setAnnee] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null); // module en cours
  const [notes, setNotes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, q] = await Promise.all([
        client.get('/evaluations/modules'),
        client.get('/evaluations/questions'),
      ]);
      setModules(m.data.data || []);
      setAnnee(m.data.annee || null);
      setQuestions(q.data.data || []);
    } catch (_) {} finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function openForm(mod) {
    setSelected(mod);
    setNotes(Array(questions.length || 15).fill(''));
  }

  const moyenne = useMemo(() => {
    const filled = notes.filter((v) => v !== '' && !Number.isNaN(Number(v)));
    if (filled.length === 0) return null;
    return (filled.reduce((a, v) => a + Number(v), 0) / filled.length).toFixed(2);
  }, [notes]);

  async function submit() {
    if (notes.some((v) => v === '')) return Alert.alert('Incomplet', 'Merci de noter les 15 critères.');
    const nums = notes.map(Number);
    if (nums.some((v) => Number.isNaN(v) || v < 0 || v > 20)) {
      return Alert.alert('Notes invalides', 'Chaque note doit être comprise entre 0 et 20.');
    }
    setSubmitting(true);
    try {
      const { data } = await client.post('/evaluations', { matiere_id: selected.matiere_id, reponses: nums });
      Alert.alert('Merci !', `${selected.module} évalué (note ${data.data.note}/20).`);
      setSelected(null);
      await load();
    } catch (e) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Envoi impossible.');
    } finally { setSubmitting(false); }
  }

  // --- Grille ------------------------------------------------------------------
  if (selected) {
    return (
      <View style={styles.flex}>
        <OfflineBanner />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{selected.module}</Text>
          <Text style={styles.sub}>
            Enseignant : {selected.enseignant} · S{selected.semestre}{annee ? ` · ${annee.libelle}` : ''}
          </Text>
          <Text style={styles.hint}>
            Notez chaque critère de 0 à 20. La note du module est la moyenne des 15 critères.
            Votre évaluation est anonyme pour l'enseignant.
          </Text>

          {questions.map((q, i) => (
            <View key={i} style={styles.qRow}>
              <Text style={styles.qText}>{i + 1}. {q}</Text>
              <TextInput
                style={styles.noteInput}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="/20"
                placeholderTextColor={colors.textLight}
                value={notes[i]}
                onChangeText={(t) => setNotes((prev) => {
                  const n = [...prev]; n[i] = t.replace(/[^0-9]/g, ''); return n;
                })}
              />
            </View>
          ))}

          <View style={styles.footer}>
            {moyenne !== null && <Text style={styles.moy}>Moyenne provisoire : {moyenne}/20</Text>}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setSelected(null)}>
                <Text style={styles.btnGhostText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnRed, submitting && { opacity: 0.6 }]}
                                onPress={submit} disabled={submitting}>
                <Text style={styles.btnRedText}>{submitting ? 'Envoi…' : 'Envoyer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // --- Liste -------------------------------------------------------------------
  return (
    <View style={styles.flex}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Évaluer les enseignants</Text>
        <Text style={styles.sub}>
          Évaluez les enseignants de vos modules{annee ? ` — ${annee.libelle}` : ''}.
          Un module ne peut être évalué qu'une fois par an.
        </Text>

        {loading ? <Text style={styles.empty}>Chargement…</Text>
          : modules.length === 0 ? (
            <Text style={styles.empty}>Aucun module à évaluer (l'enseignant doit être renseigné par l'administration).</Text>
          ) : modules.map((m) => (
            <View key={m.matiere_id} style={styles.modRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modName}>{m.module}</Text>
                <Text style={styles.modSub}>{m.enseignant} · S{m.semestre}</Text>
              </View>
              {m.deja_evalue ? (
                <View style={styles.doneChip}>
                  <Icon name="check" size={14} color="#166534" />
                  <Text style={styles.doneText}>Évalué</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.evalBtn} onPress={() => openForm(m)}>
                  <Text style={styles.evalBtnText}>Évaluer</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '900', color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 3, marginBottom: 14, lineHeight: 19 },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: 12, lineHeight: 18 },
  empty: { color: colors.textMuted, marginTop: 10, lineHeight: 20 },
  modRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  modName: { fontSize: 15, fontWeight: '800', color: colors.text },
  modSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  evalBtn: { backgroundColor: colors.brand, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 9 },
  evalBtnText: { color: '#fff', fontWeight: '800' },
  doneChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#DCFCE7', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  doneText: { color: '#166534', fontWeight: '700', fontSize: 12 },
  qRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  qText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 18 },
  noteInput: {
    width: 56, textAlign: 'center', backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, borderRadius: radius.md, paddingVertical: 9, color: colors.text, fontWeight: '800',
  },
  footer: { marginTop: 16 },
  moy: { fontWeight: '800', color: colors.text },
  btn: { flex: 1, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center' },
  btnRed: { backgroundColor: colors.brand },
  btnRedText: { color: '#fff', fontWeight: '800' },
  btnGhost: { backgroundColor: colors.muted },
  btnGhostText: { color: colors.text, fontWeight: '800' },
});
