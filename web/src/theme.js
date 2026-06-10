// Couleur par code filière (badges).
export const filiereColors = {
  MAI: '#4F46E5', BAF: '#7C3AED', GSE: '#16A34A', TL: '#0D9488',
  MMC: '#DB2777', QHSE: '#CA8A04', GRH: '#2563EB', DWMD: '#0EA5E9',
  GL: '#0891B2', SRT: '#EA580C', MJF: '#DC2626', LEA: '#65A30D',
};

export const colorForFiliere = (code) => filiereColors[code] || '#14213D';

export const labelForType = (t) =>
  ({ pdf: 'PDF', docx: 'DOCX', pptx: 'PPTX', xlsx: 'XLSX', image: 'Image', video: 'Vidéo' }[t] || 'Fichier');

export const ROLE_LABEL = { admin: 'Administrateur', delegue: 'Délégué', etudiant: 'Étudiant' };

export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}
