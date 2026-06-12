import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import OfflineBanner from '../components/OfflineBanner';
import client from '../api/client';
import { colors, radius, colorForFiliere } from '../theme';

const ROLES = [
  { key: 'etudiant', label: 'Étudiant' },
  { key: 'delegue', label: 'Délégué' },
  { key: 'admin', label: 'Admin' },
];
const EMPTY = { name: '', email: '', password: '', role: 'etudiant', filiere_id: null, niveau_id: null };

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null); // null = création
  const [q, setQ] = useState('');
  const [filiereF, setFiliereF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const [u, f] = await Promise.all([client.get('/admin/users'), client.get('/filieres')]);
    setUsers(u.data.data || []);
    setFilieres(f.data.data || []);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const niveaux = useMemo(() => filieres.find((f) => f.id === form.filiere_id)?.niveaux || [], [filieres, form.filiere_id]);

  function startEdit(u) {
    setEditingId(u.id);
    setForm({
      name: u.name || '', email: u.email || '', password: '',
      role: u.role || 'etudiant',
      filiere_id: u.filiere?.id ?? null, niveau_id: u.niveau?.id ?? null,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false); setEditingId(null); setForm(EMPTY);
  }

  async function submit() {
    if (!form.name || !form.email) return Alert.alert('Champs requis', 'Nom et email.');
    if (!editingId && !form.password) return Alert.alert('Champs requis', 'Mot de passe.');
    if (form.role === 'delegue' && !form.niveau_id) return Alert.alert('Classe requise', 'Un délégué doit avoir une classe.');
    setBusy(true);
    try {
      const payload = { ...form, filiere_id: form.filiere_id || null, niveau_id: form.niveau_id || null };
      if (editingId) {
        if (!payload.password) delete payload.password; // inchangé
        await client.put(`/admin/users/${editingId}`, payload);
      } else {
        await client.post('/admin/users', payload);
      }
      closeForm(); await load();
      Alert.alert(editingId ? 'Compte modifié' : 'Compte créé', 'Opération réussie.');
    } catch (e) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Opération impossible.');
    } finally { setBusy(false); }
  }

  function confirmDelete(u) {
    Alert.alert('Supprimer', `Supprimer ${u.name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await client.delete(`/admin/users/${u.id}`); await load(); }
        catch (_) { Alert.alert('Erreur', 'Suppression impossible.'); } } },
    ]);
  }

  const filtered = users.filter((u) => {
    if (filiereF && String(u.filiere?.id) !== String(filiereF)) return false;
    if (q) {
      const s = q.toLowerCase();
      if (!`${u.name} ${u.email} ${u.filiere?.code || ''} ${u.niveau?.nom || ''}`.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <KeyboardAvoidingView style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headRow}>
          <Text style={styles.title}>Utilisateurs ({filtered.length})</Text>
          <TouchableOpacity style={styles.newBtn}
            onPress={() => (showForm ? closeForm() : (setForm(EMPTY), setEditingId(null), setShowForm(true)))}>
            <Text style={styles.newBtnText}>{showForm ? 'Fermer' : '+ Nouveau'}</Text>
          </TouchableOpacity>
        </View>

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{editingId ? 'Modifier le compte' : 'Nouveau compte'}</Text>
            <TextInput style={styles.input} placeholder="Nom" placeholderTextColor={colors.textLight}
                       value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.textLight}
                       autoCapitalize="none" keyboardType="email-address"
                       value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} />
            <TextInput style={styles.input}
                       placeholder={editingId ? 'Mot de passe (laisser vide = inchangé)' : 'Mot de passe'}
                       placeholderTextColor={colors.textLight}
                       value={form.password} onChangeText={(t) => setForm({ ...form, password: t })} />
            <Text style={styles.lbl}>Rôle</Text>
            <View style={styles.chips}>
              {ROLES.map((r) => (
                <Chip key={r.key} label={r.label} active={form.role === r.key} color={colors.navy}
                      onPress={() => setForm({ ...form, role: r.key, niveau_id: null })} />
              ))}
            </View>
            <Text style={styles.lbl}>Filière {form.role === 'delegue' ? '(obligatoire)' : '(optionnelle)'}</Text>
            <View style={styles.chips}>
              {filieres.map((f) => (
                <Chip key={f.id} label={f.code} active={form.filiere_id === f.id}
                      color={f.couleur || colorForFiliere(f.code)}
                      onPress={() => setForm({ ...form, filiere_id: f.id, niveau_id: null })} />
              ))}
            </View>
            {form.role !== 'admin' && form.filiere_id && (
              <>
                <Text style={styles.lbl}>Niveau / Classe {form.role === 'delegue' ? '(obligatoire)' : '(optionnel)'}</Text>
                <View style={styles.chips}>
                  {niveaux.map((n) => (
                    <Chip key={n.id} label={n.nom} active={form.niveau_id === n.id} color={colors.red}
                          onPress={() => setForm({ ...form, niveau_id: n.id })} />
                  ))}
                </View>
              </>
            )}
            <TouchableOpacity style={styles.create} onPress={submit} disabled={busy}>
              <Text style={styles.createText}>
                {busy ? 'Enregistrement…' : editingId ? 'Enregistrer' : 'Créer le compte'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TextInput style={[styles.input, { marginTop: 14 }]} placeholder="Rechercher (nom, email, filière, classe)…"
                   placeholderTextColor={colors.textLight} value={q} onChangeText={setQ} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
          <Chip label="Toutes" active={!filiereF} color={colors.red} onPress={() => setFiliereF(null)} />
          {filieres.map((f) => (
            <Chip key={f.id} label={f.code} active={filiereF === f.id}
                  color={f.couleur || colorForFiliere(f.code)} onPress={() => setFiliereF(f.id)} />
          ))}
        </ScrollView>

        {filtered.map((u) => (
          <View key={u.id} style={styles.uRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.uName}>{u.name}</Text>
              <Text style={styles.uMeta}>
                {u.email} · {u.role}{u.filiere ? ` · ${u.filiere.code}` : ''}{u.niveau ? ` ${u.niveau.nom}` : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(u)}>
              <Text style={styles.editBtnText}>Éditer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.del} onPress={() => confirmDelete(u)}>
              <Text style={styles.delText}>Suppr.</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Chip({ label, active, color, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}
      style={[styles.chip, { borderColor: color }, active && { backgroundColor: color }]}>
      <Text style={[styles.chipText, { color: active ? '#fff' : color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '900', color: colors.navy },
  newBtn: { backgroundColor: colors.red, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  formCard: { backgroundColor: '#F3F3F3', borderRadius: radius.md, padding: 14, marginTop: 12 },
  formTitle: { fontSize: 15, fontWeight: '900', color: colors.navy, marginBottom: 10 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.text, marginBottom: 8,
  },
  lbl: { fontWeight: '700', color: colors.navy, marginTop: 6, marginBottom: 6, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { borderWidth: 1.5, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 5 },
  chipText: { fontWeight: '700', fontSize: 12 },
  create: { backgroundColor: colors.red, borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  createText: { color: '#fff', fontWeight: '800' },
  uRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface,
    borderRadius: radius.sm, padding: 12, marginTop: 8, borderWidth: 1, borderColor: colors.border,
  },
  uName: { fontWeight: '800', color: colors.navy },
  uMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  del: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  delText: { color: colors.red, fontWeight: '700', fontSize: 12 },
  editBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.navy, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  editBtnText: { color: colors.navy, fontWeight: '700', fontSize: 12 },
});
