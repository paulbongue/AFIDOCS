import React from 'react';
import { colorForFiliere, labelForType, formatSize } from '../theme';

// Couleurs par type de fichier (cohérent avec ResourceListItem).
const TYPE_COLORS = {
  pdf: '#C0392B', docx: '#2D6CDF', pptx: '#E07B39', xlsx: '#1E8E5A',
  image: '#7C3AED', video: '#0E7490', autre: '#64748B',
};

// Carte de ressource (mode grille).
export default function ResourceCard({ ressource, onOpen, actions }) {
  const f = ressource.matiere?.niveau?.filiere;
  const niveau = ressource.matiere?.niveau;
  const accent = f?.couleur || colorForFiliere(f?.code);
  const tColor = TYPE_COLORS[ressource.type_fichier] || TYPE_COLORS.autre;

  return (
    <div className="res-card">
      <div className="res-card-top" style={{ cursor: onOpen ? 'pointer' : 'default' }} onClick={onOpen}>
        <div className="res-icon" style={{ background: accent }}>{f?.code || '•'}</div>
        <span className="type-badge" style={{ background: tColor }}>{labelForType(ressource.type_fichier)}</span>
      </div>
      <div className="res-card-body" style={{ cursor: onOpen ? 'pointer' : 'default' }} onClick={onOpen}>
        <div className="res-title">{ressource.titre}</div>
        <div className="res-meta">
          {[f?.code, niveau?.nom, ressource.matiere?.semestre ? `S${ressource.matiere.semestre}` : null, ressource.matiere?.nom].filter(Boolean).join(' · ')}
        </div>
        <div className="res-meta">{ressource.auteur?.name} · {formatSize(ressource.taille_fichier)}</div>
      </div>
      {actions && <div className="res-card-actions">{actions}</div>}
    </div>
  );
}
