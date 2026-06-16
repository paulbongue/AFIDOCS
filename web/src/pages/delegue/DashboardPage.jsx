import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import ResourceListItem from '../../components/ResourceListItem';
import { IconUpload, IconFolder, IconSearch } from '../../components/Icons';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [all, setAll] = useState([]);

  useEffect(() => {
    client.get('/ressources').then(({ data }) => setAll(data.data || []));
  }, []);

  const mine = all.filter((r) => r.user_id === user?.id);
  const prenom = (user?.name || '').split(' ')[0] || 'délégué';

  return (
    <div>
      <div className="page-title">Bonjour, {prenom}</div>

      <div className="quick">
        <div className="quick-title">Actions rapides</div>
        <div className="quick-row">
          <button className="quick-btn primary" onClick={() => navigate('/delegue/publier')}>
            <IconUpload size={16} /> Publier
          </button>
          <button className="quick-btn" onClick={() => navigate('/delegue/mes-ressources')}>
            <IconFolder size={16} /> Mes ressources
          </button>
          <button className="quick-btn" onClick={() => navigate('/delegue/ressources')}>
            <IconSearch size={16} /> Toutes les ressources
          </button>
        </div>
      </div>

      <div className="stats-row" style={{ marginTop: 16 }}>
        <div className="stat-card"><div className="value">{mine.length}</div><div className="label">Mes publications</div></div>
        <div className="stat-card"><div className="value">{all.length}</div><div className="label">Ressources (toutes filières)</div></div>
        <div className="stat-card"><div className="value">{user?.filiere?.code || '—'}{user?.niveau ? ` ${user.niveau.nom}` : ''}</div><div className="label">Ma classe</div></div>
      </div>

      <div className="spread mt" style={{ marginTop: 28 }}>
        <h3>Mes dernières publications</h3>
        <button className="btn btn-red" onClick={() => navigate('/delegue/publier')}>⬆ Publier</button>
      </div>

      <div className="mt">
        {mine.slice(0, 5).map((r) => (
          <ResourceListItem key={r.id} ressource={r}
            onOpen={() => navigate(`/delegue/ressources/${r.id}`)} />
        ))}
        {mine.length === 0 && <div className="empty">Vous n'avez encore rien publié.</div>}
      </div>
    </div>
  );
}
