import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import ResourceListItem from '../../components/ResourceListItem';
import StatCard from '../../components/StatCard';
import DigestCard from '../../components/DigestCard';
import { IconBook, IconCap, IconLayers } from '../../components/Icons';

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

      <DigestCard />

      <div className="stats-row" style={{ marginTop: 16 }}>
        <StatCard icon={IconBook} value={stats.ressources} label="Ressources disponibles" tone="navy" />
        <StatCard icon={IconCap} value={stats.filieres} label="Filières" tone="red" />
        <StatCard icon={IconLayers} value={stats.matieres} label="Matières" tone="blue" />
      </div>

      <div className="section-head">
        <h3>Ressources récentes</h3>
        <span className="see-all" style={{ cursor: 'pointer' }} onClick={() => navigate('/etudiant/ressources')}>Voir tout →</span>
      </div>
      <div>
        {recents.map((r) => (
          <ResourceListItem key={r.id} ressource={r}
            onOpen={() => navigate(`/etudiant/ressources/${r.id}`)} />
        ))}
        {recents.length === 0 && <div className="empty">Aucune ressource pour le moment.</div>}
      </div>
    </div>
  );
}
