import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors } from '../theme';

// Logo officiel AFI-L'UE (image) + sous-titre.
export function AfiBadge({ light = false }) {
  return (
    <View style={styles.badgeRow}>
      <Image
        source={require('../../assets/logo-afi.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={[styles.subtitle, light && { color: 'rgba(255,255,255,0.85)' }]}>
        L'Université de l'Entreprise
      </Text>
    </View>
  );
}

// Wordmark "AFI-DOCS".
export function Wordmark({ color = colors.white, size = 22 }) {
  return <Text style={[styles.wordmark, { color, fontSize: size }]}>AFI-DOCS</Text>;
}

const styles = StyleSheet.create({
  badgeRow: { alignItems: 'flex-start' },
  logo: { width: 170, height: 55 },
  subtitle: { color: colors.navy, fontSize: 9, fontWeight: '700', marginTop: 4, letterSpacing: 0.2 },
  wordmark: { fontWeight: '900', letterSpacing: 1 },
});
