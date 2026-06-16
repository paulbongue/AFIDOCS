import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, shadow } from '../theme';

// Carte statistique du tableau de bord, façon maquette :
//   icône ronde teintée en haut, grande valeur, libellé dessous.
//   `icon` est un nœud (ex. <Icon name="book" .../>) rendu dans le rond pâle.
export default function StatCard({ value, label, icon, tintBg }) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: tintBg || colors.muted }]}>
        {typeof icon === 'string' ? <Text style={styles.icon}>{icon}</Text> : icon}
      </View>
      <Text style={styles.value} numberOfLines={1}>{value}</Text>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.xxl,
    paddingVertical: 14, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colo