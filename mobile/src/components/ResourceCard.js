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
    ressource.matiere_semestre ? `S${ressource.matiere_semestre}` : null,
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
            <View style={styles.cmtRow}>
              <Icon name="message-circle" size={12} color={colors.textLight} />
              <Text style={styles.sub}>{ressource.commentaires_count}</Text>
            </View>
          )}
          {isOffline && <Text style={styles.offline}>● hors-ligne</Text>}
        </View>
      </View>

      <TouchableOpacity style={styles.dlBtn} onPress={onPress} activeOpacity={0.7}>
        <Icon name="download" size={17} color={colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.xxl, padding: 12, marginHorizontal: 14, marginVertical: 5,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  gridCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.xxl,
    padding: 12, margin: 6, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  gridTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  gridTitre: { fontSize: 14, fontWeight: '800', color: colors.text },
  iconBox: {
    width: 44, height: 44, borderRadius: 13, marginRight: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  iconGlyph: { color: 'rgba(255,255,255,0.9)', fontSize: 17, marginBottom: -4 },
  iconType: { color: '#fff', fontSize: 8, fontWeight: '800' },
  body: { flex: 1 },
  titre: { fontSize: 15, fontWeight: '800', color: colors.text, lineHeight: 19 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' },
  sub: { fontSize: 11, color: colors.textLight },
  cmtRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  offline: { fontSize: 11, color: colors.success, fontWeight: '700' },
  dlBtn: {
    width: 40, height: 40, borderRadius: 20, marginLeft: 10,
    backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center',
  },
  dlGlyph: { fontSize: 16, color: colors.textMuted },
});
