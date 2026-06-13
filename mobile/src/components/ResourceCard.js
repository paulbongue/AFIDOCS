import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, colorForFiliere, labelForType, formatSize, shadow } from '../theme';

// Carte de ressource façon AFI-DOCS : icône carrée colorée (filière) + titre
// marine + ligne de méta grise.
export default function ResourceCard({ ressource, onPress, compact = false }) {
  const isOffline = !!ressource.local_uri;
  const accent = ressource.filiere_couleur || colorForFiliere(ressource.filiere_code);

  const meta = [
    ressource.filiere_code,
    ressource.niveau_nom,
    ressource.matiere_nom,
    labelForType(ressource.type_fichier),
  ].filter(Boolean).join(' · ');

  // Variante grille : carte verticale compacte (2 colonnes).
  if (compact) {
    return (
      <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.75}>
        <View style={styles.gridTop}>
          <View style={[styles.iconBox, { backgroundColor: accent, marginRight: 0 }]}>
            <Text style={styles.iconGlyph}>▢</Text>
            <Text style={styles.iconType}>{labelForType(ressource.type_fichier)}</Text>
          </View>
          {isOffline && <Text style={styles.offline}>● hors-ligne</Text>}
        </View>
        <Text style={styles.gridTitre} numberOfLines={2}>{ressource.titre}</Text>
        <Text style={styles.meta} numberOfLines={2}>{meta}</Text>
        <View style={styles.row}>
          {!!ressource.taille_fichier && (
            <Text style={styles.sub}>{formatSize(ressource.taille_fichier)}</Text>
          )}
          {ressource.commentaires_count > 0 && (
            <Text style={styles.sub}>💬 {ressource.commentaires_count}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.iconBox, { backgroundColor: accent }]}>
        <Text style={styles.iconGlyph}>▢</Text>
        <Text style={styles.iconType}>{labelForType(ressource.type_fichier)}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.titre} numberOfLines={2}>{ressource.titre}</Text>
        <Text style={styles.meta} numberOfLines={2}>{meta}</Text>
        <View style={styles.row}>
          {!!ressource.taille_fichier && (
            <Text style={styles.sub}>{formatSize(ressource.taille_fichier)}</Text>
          )}
          {ressource.commentaires_count > 0 && (
            <Text style={styles.sub}>💬 {ressource.commentaires_count}</Text>
          )}
          {isOffline && <Text style={styles.offline}>● hors-ligne</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md,
    padding: 13, marginHorizontal: 14, marginVertical: 5,
    borderWidth: 1, borderColor: colors.border, ...shadow.soft,
  },
  gridCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md,
    padding: 12, margin: 6, borderWidth: 1, borderColor: colors.border, ...shadow.soft,
  },
  gridTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  gridTitre: { fontSize: 14, fontWeight: '800', color: colors.navy },
  iconBox: {
    width: 48, height: 48, borderRadius: 12, marginRight: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  iconGlyph: { color: 'rgba(255,255,255,0.9)', fontSize: 18, marginBottom: -4 },
  iconType: { color: '#fff', fontSize: 8, fontWeight: '800' },
  body: { flex: 1 },
  titre: { fontSize: 15, fontWeight: '800', color: colors.navy },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' },
  sub: { fontSize: 11, color: colors.textLight },
  offline: { fontSize: 11, color: colors.success, fontWeight: '700' },
});
