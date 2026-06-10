// ===========================================================================
// Charte graphique AFI-DOCS — adaptée des maquettes Figma au format mobile.
//   Marine profond + rouge brique + gris clair.
// ===========================================================================

export const colors = {
  // Identité
  navy: '#14213D',        // bleu marine (login, titres, header secondaire)
  navyDark: '#0E1830',
  red: '#C0392B',         // rouge brique — header principal & actions
  redDark: '#A23222',     // état pressé
  redBright: '#E1342A',   // accent logo AFI-L'UE
  salmon: '#EBB9AC',      // surbrillance d'onglet/élément actif (fond)

  // Surfaces
  background: '#ECECEC',  // fond d'application (gris clair)
  surface: '#FFFFFF',
  cardGray: '#DCDCDC',    // carte d'information (détail ressource)
  border: '#D5D5D5',

  // Texte
  text: '#14213D',
  textMuted: '#6B7280',
  textLight: '#9AA3AF',

  // États
  success: '#16A34A',
  danger: '#C0392B',
  warning: '#D97706',
  offline: '#64748B',

  white: '#FFFFFF',
};

// Couleur par code filière (badge / icône de ressource).
export const filiereColors = {
  BAF: '#7C3AED',
  GSE: '#16A34A',
  GRH: '#2563EB',
  IR: '#EA580C',
  MJF: '#DC2626',
  MMC: '#DB2777',
  MAI: '#4F46E5',
  GL: '#0891B2',
};

export function colorForFiliere(code) {
  return filiereColors[code] || colors.navy;
}

export function iconForType(type) {
  switch (type) {
    case 'pdf': return '📕';
    case 'docx': return '📘';
    case 'pptx': return '📙';
    case 'xlsx': return '📗';
    case 'image': return '🖼️';
    case 'video': return '🎬';
    default: return '📄';
  }
}

export function labelForType(type) {
  const map = { pdf: 'PDF', docx: 'DOCX', pptx: 'PPTX', xlsx: 'XLSX', image: 'Image', video: 'Vidéo' };
  return map[type] || 'Fichier';
}

export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// Espacements et rayons cohérents (look "carte" des maquettes).
export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
};
