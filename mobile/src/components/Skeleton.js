import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, radius, shadow } from '../theme';

// Squelette animé (pulsation) pour les listes de ressources en cours de chargement.
export default function SkeletonRows({ count = 6 }) {
  const op = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(op, { toValue: 0.45, duration: 650, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [op]);

  return (
    <View style={{ paddingTop: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.row}>
          <Animated.View style={[styles.icon, { opacity: op }]} />
          <View style={{ flex: 1 }}>
            <Animated.View style={[styles.line, { width: '55%', opacity: op }]} />
            <Animated.View style={[styles.line, { width: '80%', marginTop: 8, opacity: op }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', gap: 11, alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: 10, marginHorizontal: 14, marginVertical: 4,
    borderWidth: 1, borderColor: colors.border, ...shadow.soft,
  },
  icon: { width: 42, height: 42, borderRadius: 11, backgroundColor: colors.surface2 },
  line: { height: 12, borderRadius: 6, backgroundColor: colors.surface2 },
});
