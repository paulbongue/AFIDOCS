import React from 'react';
import { colorForFiliere, labelForType, formatSize } from '../theme';

// Ligne de ressource (liste) façon AFI-DOCS.
export default function ResourceListItem({ ressource, onOpen, actions }) {
  const f = ressource.matiere?.niveau?.filiere;
  const niveau = ressource.matiere?.niveau;
  const accent = f?.couleur || colorForFiliere(f?.code);
  const meta = [
    f?.code, niveau?.nom, ressource.matiere?.nom, labelForType(ressource.type_fichier),
    ressource.auteur?.name,
  ].filter(Boolean).join(' · ');

  return (
    <div className="res-row">
      <div className="res-icon" style={{ background: accent }}>{labelForType(ressource.type_fichier)}</div>
      <div style={{ flex: 1, cursor: onOpen ? 'pointer' : 'default' }} onClick={onOpen}>
        <div className="res-title">{ressource.titre}</div>
        <div className="res-meta">{meta} · {formatSize(ressource.taille_fichier)}</div>
      </div>
      {actions}
    </div>
  );
}
