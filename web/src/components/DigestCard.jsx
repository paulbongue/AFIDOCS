import React, { useEffect, useState } from 'react';
import client from '../api/client';

function Spark({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.8 4.7L18.5 8.5 13.8 10.3 12 15l-1.8-4.7L5.5 8.5l4.7-1.8L12 2z" />
    </svg>
  );
}

// Encart « Résumé des nouveautés » : généré par l'assistant IA à partir des
// dernières annonces et des nouveaux cours de la filière de l'utilisateur.
export default function DigestCard() {
  const [summary, setSummary] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let on = true;
    client.get('/assistant/digest')
      .then(({ data }) => { if (on) setSummary(data.summary || ''); })
      .catch(() => { if (on) setErr(true); });
    return () => { on = false; };
  }, []);

  return (
    <div className="digest-card">
      <div className="digest-head"><Spark /> Résumé des nouveautés</div>
      {err ? (
        <div className="muted">Résumé indisponible pour le moment.</div>
      ) : summary === null ? (
        <div className="digest-loading"><span className="spinner" /> Génération du résumé…</div>
      ) : (
        <div className="digest-body">{summary}</div>
      )}
    </div>
  );
}
