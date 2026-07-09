import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import OfflineBanner from '../components/OfflineBanner';
import Icon from '../components/Icon';
import client from '../api/client';
import { colors, radius } from '../theme';

const uniq = (arr) => [...new Set(arr.filter((v) => v !== null && v !== undefined && v !== ''))];
const noteColor = (n) => (n >= 14 ? '#166534' : n >= 10 ? '#92400e' : '#991b1b');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Petit sélecteur horizontal de filtre (chips).
function ChipRow({ label, options, value, onChange, fmt = (x) => x }) {
  if (options.length === 0) return null;
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.filterLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <TouchableOpacity style={[styles.chip, value === '' && styles.chipOn]} onPress={() => onChange('')}>
          <Text style={[styles.chipText, value === '' && styles.chipTextOn]}>Tous</Text>
        </TouchableOpacity>
        {options.map((o) => (
          <TouchableOpacity key={String(o)} style={[styles.chip, String(value) === String(o) && styles.chipOn]}
                            onPress={() => onChange(o)}>
            <Text style={[styles.chipText, String(value) === String(o) && styles.chipTextOn]}>{fmt(o)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export default function AdminEvaluationsScreen() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fAnnee, setFAnnee] = useState('');
  const [fFiliere, setFFiliere] = useState('');
  const [fNiveau, setFNiveau] = useState('');
  const [fSemestre, setFSemestre] = useState('');
  const [onlyComplete, setOnlyComplete] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await client.get('/admin/evaluations'); setRows(data.data || []); }
    catch (_) {} finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const annees = useMemo(() => uniq(rows.map((r) => r.annee)), [rows]);
  const filieres = useMemo(() => uniq(rows.map((r) => r.filiere)), [rows]);
  const niveaux = useMemo(() => uniq(rows.map((r) => r.niveau)), [rows]);
  const semestres = useMemo(() => uniq(rows.map((r) => r.semestre)).sort((a, b) => a - b), [rows]);

  const filtered = rows.filter((r) =>
    (!fAnnee || r.annee === fAnnee) &&
    (!fFiliere || r.filiere === fFiliere) &&
    (!fNiveau || r.niveau === fNiveau) &&
    (String(fSemestre) === '' || String(r.semestre) === String(fSemestre)));

  const forPrint = onlyComplete ? filtered.filter((r) => r.complet) : filtered;

  // Construit le document HTML (fiche par enseignant) puis génère un PDF partageable.
  function buildHtml() {
    const byProf = {};
    forPrint.forEach((r) => { (byProf[r.enseignant || '—'] = byProf[r.enseignant || '—'] || []).push(r); });
    const profs = Object.keys(byProf).sort();
    const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const filtres = [
      fAnnee && `Année : ${fAnnee}`, fFiliere && `Filière : ${fFiliere}`,
      fNiveau && `Niveau : ${fNiveau}`, fSemestre !== '' && `Semestre : S${fSemestre}`,
      onlyComplete && 'Participation ≥ 80 % uniquement',
    ].filter(Boolean).join(' · ') || 'Tous les résultats';

    const sections = profs.map((prof) => {
      const list = byProf[prof].slice().sort((a, b) =>
        a.filiere.localeCompare(b.filiere) || a.niveau.localeCompare(b.niveau) || a.semestre - b.semestre);
      const moyProf = (list.reduce((s, r) => s + r.moyenne, 0) / list.length).toFixed(2);
      const lignes = list.map((r) => `
        <tr>
          <td>${esc(r.module)}</td><td>${esc(r.filiere)} · ${esc(r.niveau)}</td>
          <td class="c">S${esc(r.semestre)}</td><td class="c">${esc(r.annee)}</td>
          <td class="c">${r.nb}/${r.attendus || '—'} (${r.taux}%)${r.complet ? ' ✓' : ''}</td>
          <td class="c b">${r.moyenne.toFixed(2)}</td>
        </tr>`).join('');
      return `<section><h2>${esc(prof)} <span class="moy">Moyenne générale : ${moyProf}/20</span></h2>
        <table><thead><tr><th>Module</th><th>Classe</th><th class="c">Sem.</th><th class="c">Année</th>
        <th class="c">Participation</th><th class="c">Note /20</th></tr></thead>
        <tbody>${lignes}</tbody></table></section>`;
    }).join('');

    return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#14213D;margin:24px}
      header{border-bottom:3px solid #C0392B;padding-bottom:10px;margin-bottom:18px}
      h1{font-size:18px;margin:0;color:#C0392B}.sub{font-size:12px;color:#555;margin-top:4px}
      section{margin-bottom:22px;page-break-inside:avoid}
      h2{font-size:14px;margin:0 0 8px;border-left:4px solid #C0392B;padding-left:8px}
      .moy{float:right;font-size:12px;font-weight:normal}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}th{background:#f3f4f6}
      .c{text-align:center}.b{font-weight:700}
      footer{margin-top:24px;font-size:10px;color:#888;text-align:center}
      </style></head><body>
      <header><h1>AFI-DOCS — Évaluations des enseignants</h1>
      <div class="sub">${esc(filtres)} · Édité le ${esc(today)}</div></header>
      ${sections}
      <footer>Notes calculées sur la grille officielle AFI-L'UE (15 critères /20) — évaluations anonymes.</footer>
      </body></html>`;
  }

  async function exportPdf() {
    if (forPrint.length === 0) { Alert.alert('Rien à exporter', 'Aucune évaluation pour ces critères.'); return; }
    setExporting(true);
    try {
      const { uri } = await Print.printToFileAsync({ html: buildHtml() });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Notes des enseignants', UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert('PDF généré', `Fichier : ${uri}`);
      }
    } catch (e) {
      Alert.alert('Erreur', "L'export PDF a échoué.");
    } finally { setExporting(false); }
  }

  return (
    <View style={styles.flex}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Résultats des évaluations</Text>
        <Text style={styles.sub}>
          Note générale de chaque enseignant par module (moyenne des 15 critères, /20).
        </Text>

        <ChipRow label="Année" options={annees} value={fAnnee} onChange={setFAnnee} />
        <ChipRow label="Filière" options={filieres} value={fFiliere} onChange={setFFiliere} />
        <ChipRow label="Niveau" options={niveaux} value={fNiveau} onChange={setFNiveau} />
        <ChipRow label="Semestre" options={semestres} value={fSemestre} onChange={setFSemestre} fmt={(s) => `S${s}`} />

        <View style={styles.exportBox}>
          <View style={styles.switchRow}>
            <Switch value={onlyComplete} onValueChange={setOnlyComplete}
                    trackColor={{ true: colors.brand }} />
            <Text style={styles.switchLabel}>Uniquement les classes ≥ 80 % de participation</Text>
          </View>
          <TouchableOpacity
            style={[styles.exportBtn, (exporting || forPrint.length === 0) && { opacity: 0.5 }]}
            onPress={exportPdf}
            disabled={exporting || forPrint.length === 0}
          >
            <Icon name="download" size={16} color="#fff" />
            <Text style={styles.exportBtnText}>{exporting ? 'Génération…' : 'Exporter en PDF (par professeur)'}</Text>
          </TouchableOpacity>
        </View>

        {loading ? <Text style={styles.empty}>Chargement…</Text>
          : filtered.length === 0 ? <Text style={styles.empty}>Aucune évaluation pour ces critères.</Text>
          : filtered.map((r, i) => (
            <View key={i} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.module}>{r.module}</Text>
                <Text style={styles.meta}>{r.enseignant}</Text>
                <Text style={styles.meta2}>{r.filiere} · {r.niveau} · S{r.semestre} · {r.annee}</Text>
                <Text style={[styles.part, r.complet && styles.partOk]}>
                  Participation : {r.nb}/{r.attendus || '—'} ({r.taux ?? 0}%){r.complet ? ' · ✓ prêt' : ' · < 80%'}
                </Text>
              </View>
              <Text style={[styles.note, { color: noteColor(r.moyenne) }]}>{r.moyenne.toFixed(2)}</Text>
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
  empty: { color: colors.textMuted, marginTop: 10 },
  filterLabel: { fontSize: 12, fontWeight: '800', color: colors.textMuted, marginBottom: 6 },
  exportBox: { backgroundColor: colors.muted, borderRadius: radius.lg, padding: 12, marginTop: 4, marginBottom: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  switchLabel: { flex: 1, fontSize: 12, color: colors.text, fontWeight: '600' },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: 12,
  },
  exportBtnText: { color: '#fff', fontWeight: '800' },
  chip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 6, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  chipTextOn: { color: '#fff' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  module: { fontSize: 15, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.text, marginTop: 2 },
  meta2: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  part: { fontSize: 11, color: colors.textMuted, marginTop: 3, fontWeight: '700' },
  partOk: { color: '#166534' },
  note: { fontSize: 22, fontWeight: '900' },
});
