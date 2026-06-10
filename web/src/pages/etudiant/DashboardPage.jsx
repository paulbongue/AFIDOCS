import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import ResourceListItem from '../../components/ResourceListItem';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ ressources: 0, filieres: 0, matieres: 0 });
  const [recents, setRecents] = useState([]);

  useEffect(() => {
    (async () => {
      const [r, f] = await Promise.all([client.get('/ressources'), client.get('/filieres')]);
      const ressources = r.data.data || [];
      const filieres = f.data.data || [];
      const matieres = filieres.reduce((s, fi) =>
        s + (fi.niveaux || []).reduce((a, n) => a + (n.matieres?.length || 0), 0), 0);
      setStats({ ressources: ressources.length, filieres: filieres.length, matieres });
      setRecents(ressources.slice(0, 5));
    })();
  }, []);

  const prenom = (user?.name || '').split(' ')[0] || 'étudiant';

  return (
    <div>
      <div className="page-title">Bonjour, {prenom}</div>

      <div className="stats-row">
        <div className="stat-card"><div className="value">{stats.ressources}</div><div className="label">Ressources disponibles</div></div>
        <div className="stat-card"><div className="value">{stats.filieres}</div><div className="label">Filières</div></div>
        <div className="stat-card"><div className="value">{stats.matieres}</div><div className="label">Matières</div></div>
      </div>

      <h3 className="mt" style={{ marginTop: 28 }}>Ressources récentes</h3>
      <div className="mt">
        {recents.map((r) => (
          <ResourceListItem key={r.id} ressource={r}
            onOpen={() => navigate(`/etudiant/ressources/${r.id}`)} />
        ))}
        {recents.length === 0 && <div className="empty">Aucune ressource pour le moment.</div>}
      </div>
    </div>
  );
}
