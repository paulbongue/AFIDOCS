import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, colorForType, labelForType, formatSize, shadow } from '../theme';
import Icon from './Icon';

// Carte de ressource façon maquette : badge carré coloré PAR TYPE de fichier
// (PDF violet, DOCX bleu…), titre, méta (filière · niveau · matière), et bouton
// de téléchargement rond à droite.
export default function ResourceCard({ ressource, onPress, compact = false }) {
  const isOffline = !!ressource.local_uri;
  const typeColor = colorForType(ressource.type_fichier);

  const meta = [
    ressource.filiere_code,
    ressource.niveau_nom,
    ressource.matiere_nom,
  ].filter(Boolean).join(' · ');

  const FileBadge = (
    <View style={[styles.iconBox, { backgroundColor: typeColor }]}>
      <Icon name={ressource.type_fichier} size={18} color="#fff" strokeWidth={2.2} />
      <Text style={styles.iconType}>{labelForType(ressource.type_fichier)}</Text>
    </View>
  );

  // Variante grille : carte verticale compacte (2 colonnes).
  if (compact) {
    return (
      <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.gridTop}>
          {FileBadge}
          {isOffline && <Text style={styles.offline}>● hors-ligne</Text>}
        </View>
        <Text style={styles.gridTitre} numberOfLines={2}>{ressource.titre}</Text>
        <Text style={styles.meta} numberOfLines={2}>{meta}</Text>
        <View style={styles.row}>
          {!!ressource.taille_fichier && (
            <Text style={styles.sub}>{formatSize(ressource.taille_fichier)}</Text>
          )}
          {ressource.commentaires_count > 0 && (
            <View style={styles.cmtRow}>
              <Icon name="message-circle" size={12} color={colors.textLight} />
              <Text style={styles.sub}>{ressource.commentaires_count}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {FileBadge}

      <View style={styles.body}>
        <Text style={styles.titre} numberOfLines={2}>{ressource.titre}</Text>
        {!!meta && <Text style={styles.meta} numberOfLines={1}>{meta}</Text>}
        <View style={styles.row}>
          {!!ressource.taille_fichier && (
            <Text style={styles.sub}>{formatSize(ressource.taille_fichier)}</Text>
          )}
          {ressource.commentaires_count > 0 && (