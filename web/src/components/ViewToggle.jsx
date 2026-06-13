import React from 'react';

// Bascule liste / grille. Le mode est mémorisé par le parent (et persistant via localStorage).
export default function ViewToggle({ value, onChange }) {
  return (
    <div className="view-toggle" role="group" aria-label="Mode d'affichage">
      <button type="button" className={value === 'list' ? 'active' : ''}
              onClick={() => onChange('list')} aria-pressed={value === 'list'} title="Liste">
        ☰ Liste
      </button>
      <button type="button" className={value === 'grid' ? 'active' : ''}
              onClick={() => onChange('grid')} aria-pressed={value === 'grid'} title="Cartes">
        ▦ Cartes
      </button>
    </div>
  );
}

// Petit hook : conserve le choix d'affichage entre les visites.
export function useViewMode(key = 'afi-view') {
  const [view, setView] = React.useState(() => {
    try { return localStorage.getItem(key) || 'list'; } catch { return 'list'; }
  });
  const update = React.useCallback((v) => {
    setView(v);
    try { localStorage.setItem(key, v); } catch { /* ignore */ }
  }, [key]);
  return [view, update];
}
