import React from 'react';

// Indicateur de chargement : spinner centré (remplace le « Chargement… » brut).
export default function Loader({ label = 'Chargement…' }) {
  return (
    <div className="loader">
      <div className="spinner" aria-hidden="true" />
      {label && <span>{label}</span>}
    </div>
  );
}

// Squelette de liste (ressources) : barres animées le temps du chargement.
export function SkeletonRows({ count = 5 }) {
  return (
    <div aria-busy="true" aria-label="Chargement">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skel-row">
          <div className="skel skel-icon" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="skel skel-line" style={{ width: '55%' }} />
            <div className="skel skel-line" style={{ width: '82%', marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
