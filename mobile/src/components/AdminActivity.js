import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

import client, { TOKEN_KEY } from '../api/client';
import { API_URL } from '../config';
import { useNetwork } from '../context/NetworkContext';
import { colors, radius } from '../theme';

const SERIES = [
  { key: 'download', label: 'Téléch.', color: colors.navy },
  { key: 'view', label: 'Consult.', color: colors.red },
  { key: 'comment', label: 'Comment.', color: '#E07B39' },
];

function isoDay(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

// Suivi d'activité (mobile) : fréquence par jour + rapport CSV téléchargeable.
export default function AdminActivity() {
  const { isOnline } = useNetwork();
  const [days, setDays] = useState(14);
  const [data, setData] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get('/admin/activity', { params: { days } });
      setData(data);
    } catch (_) { /* hors-ligne / erreur */ }
  }, [days]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function downloadReport(nbDays) {
    if (!isOnline) return Alert.alert('Hors-ligne', 'Connecte-toi à internet pour générer le rapport.');
    setDownloading(true);
    try {
      const to = isoDay(0);
      const from = isoDay(-(nbDays - 1));
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const url = `${API_URL}/admin/activity/report?from=${from}&to=${to}`;
      const dest = `${FileSystem.documentDirectory}rapport-activite_${from}_${to}.csv`;
      // Téléchargement natif direct (gère correctement le fichier streamé + l'auth).
      const result = await FileSystem.downloadAsync(url, dest, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/csv', 'X-Platform': 'mobile' },
      });
      if (result.status !== 200) throw new Error('HTTP ' + result.status);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, { mimeType: 'text/csv', dialogTitle: "Rapport d'activité AFI-DOCS" });
      } else {
        Alert.alert('Rapport enregistré', result.uri);
      }
    } catch (e) {
      Alert.alert('Erreur', 'Génération du rapport impossible.');
    } finally { setDownloading(false); }
  }

  const dd = data?.days || [];
  const maxVal = Math.max(1, ...dd.flatMap((d) => [d.download, d.view, d.comment]));
  const totalAll = data ? data.totaux.download + data.totaux.view + data.totaux.comment : 0;
  const sumPlat = (p) => p.download + p.view + p.comment;

  return (
    <View>
      <View style={styles.headRow}>
        <Text style={styles.section}>Activité par jour</Text>
        <View style={styles.toggle}>
          {[7, 14, 30].map((n) => (
            <TouchableOpacity key={n} style={[styles.tBtn, days === n && styles.tBtnActive]} onPress={() => setDays(n)}>
              <Text style={[styles.tText, days === n && styles.tTextActive]}>{n}j</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.legend}>
          {SERIES.map((s) => (
            <View key={s.key} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <Text style={styles.legendText}>{s.label}</Text>
            </View>
          ))}
        </View>

        {!data ? (
          <ActivityIndicator color={colors.red} style={{ marginVertical: 20 }} />
        ) : totalAll === 0 ? (
          <Text style={styles.empty}>Aucune activité enregistrée sur la période.</Text>
        ) : (
          <>
            <View style={styles.chart}>
              {dd.map((d) => (
                <View key={d.date} style={styles.col}>
                  <View style={styles.bars}>
                    {SERIES.map((s) => (
                      <View key={s.key} style={{
                        width: 5, marginHorizontal: 0.5, backgroundColor: s.color,
                        borderTopLeftRadius: 2, borderTopRightRadius: 2,
                        height: Math.max(d[s.key] > 0 ? 3 : 0, (d[s.key] / maxVal) * 110),
                      }} />
                    ))}
                  </View>
                  <Text style={styles.colLabel}>{d.date.slice(8)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.platRow}>
              <Text style={styles.platText}>En ligne (web) : <Text style={styles.platNum}>{sumPlat(data.par_plateforme.web)}</Text></Text>
              <Text style={styles.platText}>Mobile : <Text style={styles.platNum}>{sumPlat(data.par_plateforme.mobile)}</Text></Text>
            </View>
          </>
        )}
      </View>

      <Text style={styles.section}>Rapport complet</Text>
      <View style={styles.card}>
        <Text style={styles.reportHint}>
          Rapport CSV séparant l'activité en ligne (web) et mobile. Choisis la durée :
        </Text>
        <View style={styles.reportBtns}>
          {[7, 30, 90].map((n) => (
            <TouchableOpacity key={n} style={styles.reportBtn} disabled={downloading}
                              onPress={() => downloadReport(n)}>
              <Text style={styles.reportBtnText}>{n} derniers jours</Text>
            </TouchableOpacity>
          ))}
        </View>
        {downloading && <ActivityIndicator color={colors.red} style={{ marginTop: 10 }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 8 },
  section: { fontSize: 16, fontWeight: '800', color: colors.navy },
  toggle: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' },
  tBtn: { paddingHorizontal: 12, paddingVertical: 5 },
  tBtnActive: { backgroundColor: colors.red },
  tText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  tTextActive: { color: '#fff' },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.border },
  legend: { flexDirection: 'row', gap: 14, marginBottom: 12, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 11, height: 11, borderRadius: 3 },
  legendText: { fontSize: 12, color: colors.textMuted },
  empty: { color: colors.textMuted, fontStyle: 'italic', paddingVertical: 16, textAlign: 'center' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 140 },
  col: { flex: 1, alignItems: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 112 },
  colLabel: { fontSize: 9, color: colors.textLight, marginTop: 4 },
  platRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 },
  platText: { fontSize: 13, color: colors.textMuted },
  platNum: { fontWeight: '800', color: colors.navy },
  reportHint: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
  reportBtns: { gap: 8 },
  reportBtn: { borderWidth: 1.5, borderColor: colors.navy, borderRadius: radius.sm, paddingVertical: 11, alignItems: 'center' },
  reportBtnText: { color: colors.navy, fontWeight: '700' },
});
