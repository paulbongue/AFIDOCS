import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetwork } from '../context/NetworkContext';
import { colors } from '../theme';

// Bandeau affiche en haut quand l'appareil est hors-ligne.
export default function OfflineBanner() {
  const { isOnline } = useNetwork();
  if (isOnline) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>● Mode hors-ligne — contenu en cache local</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.offline, paddingVertical: 6, paddingHorizontal: 12 },
  text: { color: '#fff', fontSize: 12, textAlign: 'center', fontWeight: '600' },
});
