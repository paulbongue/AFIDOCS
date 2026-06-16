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
            <Text style={styles.sub}>💬 {re