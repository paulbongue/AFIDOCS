// Couleur par code filière (badges).
export const filiereColors = {
  BAF: '#7C3AED', GSE: '#16A34A', GRH: '#2563EB', IR: '#EA580C',
  MJF: '#DC2626', MMC: '#DB2777', MAI: '#4F46E5', GL: '#0891B2',
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
