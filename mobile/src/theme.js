// ===========================================================================
// Charte graphique AFI-DOCS — adaptée des maquettes Figma au format mobile.
//   Marine profond + rouge brique + gris clair.
// ===========================================================================

export const colors = {
  // Identité (charte alignée sur la maquette « University Hub » / Lovable)
  navy: '#0F1932',        // bleu nuit — avatars, titres forts, icône nav inactive
  navyDark: '#0B1326',
  brand: '#CF4238',       // rouge institutionnel — header, actions, état actif
  red: '#CF4238',         // alias historique de `brand`
  brandDark: '#0F1932',   // alias bleu nuit
  redDark: '#B5392F',     // état pressé
  redBright: '#E1342A',   // accent logo AFI-L'UE
  brandSoft: 'rgba(207,66,56,0.12)', // pilule active, bulle envoyée, badge rôle
  salmon: '#F7E2DE',      // surbrillance d'onglet/élément actif (fond rose pâle)

  navy2: '#1E2A47',

  // Surfaces
  background: '#F8FAFC',  // fond d'application
  surface: '#FFFFFF',
  surface2: '#F1F4F8',
  muted: '#EFF2F5',       // fonds secondaires (pastilles, champs)
  cardGray: '#EFF2F5',    // carte d'information (détail ressource)
  border: '#E1E5EA',
  borderStrong: '#CBD2DA',

  // Texte (contrastes AA sur fond clair)
  text: '#081123',
  textMuted: '#5C646F',   // texte secondaire (~5.8:1)
  textLight: '#5C646F',

  // Couleurs par type de fichier (badges)
  filePdf: '#8047E1',     // violet
  fileDocx: '#362AC1',    // bleu
  filePptx: '#F3680F',    // orange
  fileXlsx: '#23A136',    // vert
  fileImage: '#0891B2',   // teal
  download: '#23A136',    // vert téléchargement / hors-ligne
  notif: '#F3680F',       // orange notifications / annonces

  // États
  success: '#23A136',
  danger: '#CF4238',
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

// Couleur du badge selon le TYPE de fichier (façon maquette : PDF violet, DOCX bleu…).
export function colorForType(type) {
  switch (type) {
    case 'pdf': return colors.filePdf;
    case 'docx': return colors.fileDocx;
    case 'pptx': return colors.filePptx;
    case 'xlsx': return colors.fileXlsx;
    case 'image': return colors.fileImage;
    case 'video': return colors.filePptx;
    default: return colors.navy;
  }
}

export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// Espacements et rayons cohérents (look "carte" des maquettes).
export const radius = { sm: 10, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  soft: {
    shadowColor: '#101828',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
};
