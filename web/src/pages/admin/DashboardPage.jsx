import React, { useEffect, useState } from 'react';
import client from '../../api/client';
import Badge from '../../components/Badge';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    client.get('/admin/stats').then(({ data }) => setStats(data));
  }, []);

  if (!stats) return <div className="empty">Chargement…</div>;

  const t = stats.totaux;
  const maxRes = Math.max(1, ...stats.ressources_par_filiere.map((x) => x.ressources));

  return (
    <div>
      <div className="page-title">Tableau de bord — Administration</div>

      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="value">{t.ressources}</div><div className="label">Ressources</div></div>
        <div className="stat-card"><div className="value">{t.utilisateurs}</div><div className="label">Utilisateurs</div></div>
        <div className="stat-card"><div className="value">{t.commentaires}</div><div className="label">Commentaires</div></div>
        <div className="stat-card"><div className="value">{t.filieres}</div><div className="label">Filières</div></div>
      </div>

      <h3 className="mt" style={{ marginTop: 28 }}>Ressources par filière</h3>
      <div className="card mt">
        {stats.ressources_par_filiere.map((f) => (
          <div key={f.code} className="row" style={{ marginBottom: 10, gap: 12 }}>
            <div style={{ width: 56 }}><Badge code={f.code} couleur={f.couleur} /></div>
            <div style={{ flex: 1, background: '#EFEFEF', borderRadius: 6, height: 18, overflow: 'hidden' }}>
              <div style={{ width: `${(f.ressources / maxRes) * 100}%`, height: '100%', background: f.couleur }} />
            </div>
            <div style={{ width: 30, textAlign: 'right', fontWeight: 700 }}>{f.ressources}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
