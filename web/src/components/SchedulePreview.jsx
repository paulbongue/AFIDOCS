import React, { useState } from 'react';
import { labelForType, formatSize } from '../theme';

// Emploi du temps : aperçu intégré (in-app) + ouverture dans un onglet.
export default function SchedulePreview({ schedule }) {
  const [show, setShow] = useState(false);
  if (!schedule?.url_fichier) return null;

  const t = schedule.type_fichier;
  return (
    <div>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-red" onClick={() => setShow((s) => !s)}>
          👁 {show ? "Masquer l'emploi du temps" : "Ouvrir l'emploi du temps"}
        </button>
        <a className="btn btn-ghost" href={schedule.url_fichier} target="_blank" rel="noreferrer">Nouvel onglet</a>
        <span className="muted">{labelForType(t)} · {formatSize(schedule.taille_fichier)}</span>
      </div>

      {show && (
        <div className="card mt" style={{ padding: 0, overflow: 'hidden' }}>
          {t === 'image' ? (
            <img src={schedule.url_fichier} alt="Emploi du temps" style={{ width: '100%', display: 'block' }} />
          ) : t === 'pdf' ? (
            <iframe title="Emploi du temps" src={schedule.url_fichier}
                    style={{ width: '100%', height: '72vh', border: 'none', display: 'block' }} />
          ) : (
            <div className="card">
              <div className="muted">
                L'aperçu intégré n'est disponible que pour les PDF et les images.{' '}
                <a href={schedule.url_fichier} target="_blank" rel="noreferrer">Télécharger le fichier</a>.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
