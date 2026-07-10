import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
// Création : prénom + nom (identifiant généré côté serveur, comme sur le web).
// Édition : nom complet + email (identifiant modifiable).
const EMPTY = { prenom: '', nom: '', name: '', email: '', email_contact: '', password: '', role: 'etudiant', filiere_id: null, niveau_id: null };

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null); // null = création
  const [q, setQ] = useState('');
  const [filiereF, setFiliereF] = useState(null);
  const [niveauF, setNiveauF] = useState(null);      // filtre niveau/classe
  const [visible, setVisible] = useState(10);         // pagination "voir plus"
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Niveaux de la filière filtrée (pour le sous-filtre par classe).
  const filterNiveaux = useMemo(
    () => filieres.find((f) => String(f.id) === String(filiereF))?.niveaux || [],
    [filieres, filiereF],
  );

  // On revient à la 1re page dès qu'un filtre change.
  useEffect(() => { setVisible(10); }, [q, filiereF, niveauF]);

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
      prenom: '', nom: '',
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
    // Validation selon le mode (création = prénom+nom ; édition = nom complet).
    if (editingId) {
      if (!form.name) return Alert.alert('Champs requis', 'Le nom complet est requis.');
    } else {
      if (!form.prenom || !form.nom) return Alert.alert('Champs requis', 'Prénom et nom sont requis.');
      if (!form.password) return Alert.alert('Champs requis', 'Le mot de passe est requis.');
    }
    if (form.role === 'delegue' && !form.niveau_id) return Alert.alert('Classe requise', 'Un délégué doit avoir une classe.');
    setBusy(true);
    try {
      const base = { role: form.role, filiere_id: form.filiere_id || null, niveau_id: form.niveau_id || null };
      if (editingId) {
        const payload = { ...base, name: form.name, email: form.email };
        if (form.password) payload.password = form.password;
        await client.put(`/admin/users/${editingId}`, payload);
      } else {
        // Identifiant généré côté serveur à partir du prénom, du nom, de la filière et du niveau.
        const payload = { ...base, prenom: form.prenom, nom: form.nom, password: form.password };
        if (form.email_contact?.trim()) payload.email_contact = form.email_contact.trim();
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
    if (niveauF && String(u.niveau?.id) !== String(niveauF)) return false;
    if (q) {
      const s = q.toLowerCase();
      if (!`${u.name} ${u.email} ${u.filiere?.code || ''} ${u.niveau?.nom || ''}`.toLowerCase().includes(s)) return false;
    }
    return true;
  });
  const shown = filtered.slice(0, visible);

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

            {editingId ? (
              <>
                <TextInput style={styles.input} placeholder="Nom complet" placeholderTextColor={colors.textLight}
                           value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
                <TextInput style={styles.input} placeholder="Identifiant (email)" placeholderTextColor={colors.textLight}
                           autoCapitalize="none" keyboardType="email-address"
                           value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} />
              </>
            ) : (
              <>
                <TextInput style={styles.input} placeholder="Prénom" placeholderTextColor={colors.textLight}
                           value={form.prenom} onChangeText={(t) => setForm({ ...form, prenom: t })} />
                <TextInput style={styles.input} placeholder="Nom" placeholderTextColor={colors.textLight}
                           value={form.nom} onChangeText={(t) => setForm({ ...form, nom: t })} />
                <TextInput style={styles.input} placeholder="E-mail réel (facultatif — envoi auto des accès)"
                           placeholderTextColor={colors.textLight} autoCapitalize="none" keyboardType="email-address"
                           value={form.email_contact} onChangeText={(t) => setForm({ ...form, email_contact: t })} />
              </>
            )}

            <TextInput style={styles.input}
                       placeholder={editingId ? 'Mot de passe (laisser vide = inchangé)' : 'Mot de passe'}
                       placeholderTextColor={colors.textLight}
                       value={form.password} onChangeText={(t) => setForm({ ...form, password: t })} />
            {editingId && (
              <TouchableOpacity style={styles.resetLink} onPress={() => setForm({ ...form, password: 'Afi@2026' })}>
                <Text style={styles.resetLinkText}>Réinitialiser à « Afi@2026 » (l'étudiant devra le changer)</Text>
              </TouchableOpacity>
            )}
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
            {!editingId && (
              <Text style={styles.note}>
                L'identifiant de connexion sera généré automatiquement à partir du prénom, du nom,
                de la filière et du niveau.
              </Text>
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
          <Chip label="Toutes" active={!filiereF} color={colors.red} onPress={() => { setFiliereF(null); setNiveauF(null); }} />
          {filieres.map((f) => (
            <Chip key={f.id} label={f.code} active={filiereF === f.id}
                  color={f.couleur || colorForFiliere(f.code)} onPress={() => { setFiliereF(f.id); setNiveauF(null); }} />
          ))}
        </ScrollView>

        {/* Sous-filtre par niveau / classe une fois une filière choisie */}
        {filiereF && filterNiveaux.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
            <Chip label="Tous niveaux" active={!niveauF} color={colors.navy} onPress={() => setNiveauF(null)} />
            {filterNiveaux.map((n) => (
              <Chip key={n.id} label={n.nom} active={String(niveauF) === String(n.id)} color={colors.navy}
                    onPress={() => setNiveauF(n.id)} />
            ))}
          </ScrollView>
        )}

        {shown.map((u) => (
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

        {filtered.length === 0 && <Text style={styles.muted}>Aucun compte ne correspond.</Text>}
        {filtered.length > visible && (
          <TouchableOpacity style={styles.more} onPress={() => setVisible((v) => v + 10)}>
            <Text style={styles.moreText}>Voir plus ({filtered.length - visible} restant·s)</Text>
          </TouchableOpacity>
        )}
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
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 10 },
  resetLink: { marginTop: -2, marginBottom: 8 },
  resetLinkText: { color: colors.red, fontWeight: '700', fontSize: 12 },
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
  muted: { color: colors.textMuted, textAlign: 'center', padding: 20 },
  more: { borderWidth: 1.5, borderColor: colors.navy, borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  moreText: { color: colors.navy, fontWeight: '800' },
});
