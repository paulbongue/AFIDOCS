import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, shadow } from '../theme';

// Carte statistique du tableau de bord (grand nombre + libellé + icône).
export default function StatCard({ value, label, icon }) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md,
    padding: 12, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  value: { fontSize: 26, fontWeight: '900', color: colors.navy },
  icon: { fontSize: 16 },
  label: { fontSize: 11, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
});
