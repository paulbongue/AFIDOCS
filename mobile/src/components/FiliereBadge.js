import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colorForFiliere } from '../theme';

// Badge colore par filiere (charte du memoire).
export default function FiliereBadge({ code, couleur, small }) {
  const bg = couleur || colorForFiliere(code);
  return (
    <View style={[styles.badge, { backgroundColor: bg }, small && styles.small]}>
      <Text style={[styles.text, small && styles.textSmall]}>{code}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  small: { paddingHorizontal: 6, paddingVertical: 2 },
  text: { color: '#fff', fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
  textSmall: { fontSize: 10 },
});
