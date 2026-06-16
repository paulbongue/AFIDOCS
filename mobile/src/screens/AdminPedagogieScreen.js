import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import OfflineBanner from '../components/OfflineBanner';
import client from '../api/client';
import { colors, radius, colorForFiliere } from '../theme';

const PALETTE = ['#4F46E5', '#7C3AED', '#16A34A', '#0D9488', '#DB2777', '#CA8A04',
  '#2563EB', '#0EA5E9', '#0891B2', '#EA580C', '#DC2626', '#65A30D'];

// Gestion pédagogique (admin) : Filière -> Niveau -> Matière, en drill-down.
export default function AdminPedagogieScreen() {
  const [filieres, setFilieres] = useState([]);
  const [selF, setSelF] = useState(null);   // filière sélectionnée (objet)
  const [selN, setSelN] = useState(null);   // niveau sélectionné (objet)

  const [newF, setNewF] = useState({ code: '', nom: '', couleur: PALETTE[0] });
  const [newN, setNewN] = useState('');
  const [newM, setNewM] = useState('');

  const load = useCallback(async () => {
    const { data } = await client.get('/filieres');
    const list = data.data || [];
    setFilieres(list);
    setSelF((p) => (p ? list.find((f) => f.id === p.id) || null : null));
    setSelN((p) => {
      if (!p) return null;
      const f = list.find((x) => x.niveaux?.some((n) => n.id === p.id));
      return f?.niveaux.find((n) => n.id === p.id) || null;
    });
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function addFiliere() {
    if (!newF.code || !newF.nom) return Alert.alert('Champs requis', 'Code et nom obligatoires.');
    try { await client.post('/admin/filieres', newF); setNewF({ code: '', nom: '', couleur: PALETTE[0] }); await load(); }
    catch (e) { Alert.alert('Erreur', e?.response?.data?.message || 'Ajout impossible.'); }
  }
  function delFiliere(f) {
    Alert.alert('Supprimer', `Supprimer la filière ${f.code} et tout son contenu ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await client.delete(`/admin/filieres/${f.id}`); if (selF?.id === f.id) { setSelF(null); setSelN(null); } await load(); }
        catch (_) { Alert.alert('Erreur', 'Suppression impossible.'); } } },
    ]);
  }
  async function addNiveau() {
    if (!newN || !selF) return;
    try { await client.post('/admin/niveaux', { nom: newN, filiere_id: selF.id }); setNewN(''); await load(); }
    catch (_) { Alert.alert('Erreur', 'Ajout impossible.'); }
  }
  function delNiveau(n) {
    Alert.alert('Supprimer', `Supprimer le niveau ${n.nom} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await client.delete(`/admin/niveaux/${n.id}`); if (selN?.id === n.id) setSelN(null); await load(); }
        catch (_) { Alert.alert('Erreur', 'Suppression impossible.'); } } },
    ]);
  }
  async function addMatiere() {
    if (!newM || !selN) return;
    try { await client.post('/admin/matieres', { nom: newM, niveau_id: selN.id }); setNewM(''); await load(); }
    catch (_) { Alert.alert('Erreur', 'Ajout impossible.'); }
  }
  function delMatiere(m) {
    Alert.alert('Supprimer', `Supprimer la matière « ${m.nom} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await client.delete(`/admin/matieres/${m.id}`); await load(); }
        catch (_) { Alert.alert('Erreur', 'Suppression impossible.'); } } },
    ]);
  }

  const niveaux = selF?.niveaux || [];
  const matieres = niveaux.find((n) => n.id === selN?.id)?.matieres || [];

  return (
    <View style={styles.flex}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Fil d'Ariane */}
        <Text style={styles.crumb}>
          <Text onPress={() => { setSelF(null); setSelN(null); }} style={styles.crumbLink}>Filières</Text>
          {selF ? <Text> › <Text onPress={() => setSelN(null)} style={styles.crumbLink}>{selF.code}</Text></Text> : null}
          {selN ? <Text> › {selN.nom}</Text> : null}
        </Text>

        {/* Niveau 1 : Filières */}
        {!selF && (
          <>
            <Text style={styles.title}>Filières</Text>
            {filieres.map((f) => (
              <View key={f.id} style={styles.row}>
                <TouchableOpacity style={styles.rowMain} onPress={() => setSelF(f)}>
                  <View style={[styles.badge, { backgroundColor: f.couleur || colorForFiliere(f.code) }]}>
                    <Text style={styles.badgeText}>{f.code}</Text>
                  </View>
                  <Text style={styles.rowText} numberOfLines={1}>{f.nom}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.xBtn} onPress={() => delFiliere(f)}><Text style={styles.x}>✕</Text></TouchableOpacity>
              </View>
            ))}
            <View style={styles.addCard}>
              <Text style={styles.addTitle}>Ajouter une filière</Text>
              <TextInput style={styles.input} placeholder="Code (ex : GL)" placeholderTextColor={colors.textLight}
                         value={newF.code} onChangeText={(t) => setNewF({ ...newF, code: t.toUpperCase() })} />
              <TextInput style={styles.input} placeholder="Nom complet" placeholderTextColor={colors.textLight}
                         value={newF.nom} onChangeText={(t) => setNewF({ ...newF, nom: t })} />
              <View style={styles.palette}>
                {PALETTE.map((c) => (
                  <TouchableOpacity key={c} onPress={() => setNewF({ ...newF, couleur: c })}
                    style={[styles.swatch, { backgroundColor: c }, newF.couleur === c && styles.swatchActive]} />
                ))}
              </View>
              <TouchableOpacity style={styles.add} onPress={addFiliere}><Text style={styles.addText}>Ajouter</Text></TouchableOpacity>
            </View>
          </>
        )}

        {/* Niveau 2 : Niveaux d'une filière */}
        {selF && !selN && (
          <>
            <Text style={styles.title}>Niveaux — {selF.code}</Text>
            {niveaux.map((n) => (
              <View key={n.id} style={styles.row}>
                <TouchableOpacity style={styles.rowMain} onPress={() => setSelN(n)}>
                  <Text style={styles.rowText} numberOfLines={1}>{n.nom}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.xBtn} onPress={() => delNiveau(n)}><Text style={styles.x}>✕</Text></TouchableOpacity>
              </View>
            ))}
            <View style={styles.addCard}>
              <Text style={styles.addTitle}>Ajouter un niveau</Text>
              <TextInput style={styles.input} placeholder="Niveau (ex : M1)" placeholderTextColor={colors.textLight}
                         value={newN} onChangeText={setNewN} />
              <TouchableOpacity style={styles.add} onPress={addNiveau}><Text style={styles.addText}>Ajouter</Text></TouchableOpacity>
            </View>
          </>
        )}

        {/* Niveau 3 : Matières d'un niveau */}
        {selN && (
          <>
            <Text style={styles.title}>Matières — {selF.code} · {selN.nom}</Text>
            {matieres.map((m) => (
              <View key={m.id} style={styles.row}>
                <Text style={[styles.rowText, { flex: 1 }]} numberOfLines={2}>{m.nom}</Text>
                <TouchableOpacity style={styles.xBtn} onPress={() => delMatiere(m)}><Text style={styles.x}>✕</Text></TouchableOpacity>
              </View>
            ))}
            <View style={styles.addCard}>
              <Text style={styles.addTitle}>Ajouter une matière</Text>
              <TextInput style={styles.input} placeholder="Nom de la matière" placeholderTextColor={colors.textLight}
                         value={newM} onChangeText={setNewM} />
              <TouchableOpacity style={styles.add} onPress={addMatiere}><Text style={styles.addText}>Ajouter</Text></TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  crumb: { color: colors.textMuted, marginBottom: 12 },
  crumbLink: { color: colors.red, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '900', color: colors.navy, marginBottom: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border, gap: 10,
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  rowText: { color: colors.navy, fontWeight: '600', flex: 1, flexShrink: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  x: { color: colors.red, fontWeight: '800', fontSize: 16 },
  xBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  addCard: { backgroundColor: '#F3F3F3', borderRadius: radius.md, padding: 14, marginTop: 8 },
  addTitle: { fontWeight: '800', color: colors.navy, marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.text, marginBottom: 8,
  },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  swatch: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: colors.navy },
  add: { backgroundColor: colors.red, borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center' },
  addText: { col