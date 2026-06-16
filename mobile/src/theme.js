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

  navy2: '#1E2A47',

  // Surfaces
  background: '#EEF0F3',  // fond d'application (gris bleuté doux)
  surface: '#FFFFFF',
  surface2: '#F7F8FA',
  cardGray: '#E4E7EB',    // carte d'information (détail ressource)
  border: '#DEE2E7',
  borderStrong: '#CBD2DA',

  // Texte (contrastes alignés sur le web — AA sur fond clair)
  text: '#14213D',
  textMuted: '#4E5763',   // texte secondaire (~6.3:1)
  textLight: '#5B6472',   // anciennement #98A2B0 (sous le seuil) → AA (~5.8:1)

  // États
  success: '#16A34A',
  danger: '#C0392B',
  warning: '#D97706',
  offline: '#64748B',

  white: '#FFFFFF',
};

// Couleur par code filière (badge / icône de ressource).
export const filiereColors = {
  MAI: '#4F46E5',
  BAF: '#7C3AED',
  GSE: '#16A34A',
  TL: '#0D9488',
  MMC: '#DB2777',
  QHSE: '#CA8A04',
  GRH: '#2563EB',
  DWMD: '#0EA5E9',
  GL: '#0891B2',
  SRT: '#EA580C',
  MJF: '#DC2626',
  LEA: '#65A30D',
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
    shadowColor: '#101828',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  soft: {