import React from 'react';
import { colorForFiliere, labelForType, formatSize } from '../theme';

// Couleurs par type de fichier (badge coloré façon maquette).
const TYPE_COLORS = {
  pdf: '#C9302D', docx: '#2D6CDF', pptx: '#F3680F', xlsx: '#23A136',
  image: '#8047E1', video: '#0891B2', autre: '#64748B',
};

// Ligne de ressource (liste) façon AFI-DOCS.
export default function ResourceListItem({ ressource, onOpen, actions }) {
  const f = ressource.matiere?.niveau?.filiere;
  const niveau = ressource.matiere?.niveau;
  const accent = f?.couleur || colorForFiliere(f?.code);
  const tColor = TYPE_COLORS[ressource.type_fichier] || TYPE_COLORS.autre;
  const sem = ressource.matiere?.semestre ? `S${ressource.matiere.semestre}` : null;
  const meta = [
    f?.code, niveau?.nom, sem, ressource.matiere?.nom, ressource.auteur?.name,
  ].filter(Boolean).join(' · ');

  return (
    <div className="res-row">
      <div className="res-icon" style={{ background: accent }}>{f?.code || '•'}</div>
      <div style={{ flex: 1, minWidth: 0, cursor: onOpen ? 'pointer' : 'default' }} onClick={onOpen}>
        <div className="res-title">{ressource.titre}</div>
        <div className="res-meta">{meta} · {formatSize(ressource.taille_fichier)}</div>
      </div>
      <span className="type-badge" style={{ background: tColor }}>{labelForType(ressource.type_fichier)}</span>
      {actions}
    </div>
  );
}
