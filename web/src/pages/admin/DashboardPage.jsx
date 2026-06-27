import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import Badge from '../../components/Badge';
import StatCard from '../../components/StatCard';
import { IconBook, IconUsers, IconBell, IconCap, IconSearch, IconUpload, IconSliders, IconDownload } from '../../components/Icons';
import ActivityPanel from '../../components/ActivityPanel';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    client.get('/admin/stats').then(({ data }) => setStats(data));
  }, []);

  if (!stats) return <div className="empty">Chargement…</div>;

  const t = stats.totaux;
  const maxRes = Math.max(1, ...stats.ressources_par_filiere.map((x) => x.ressources));

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Tableau de bord</h1>
        <p className="page-sub">Vue d'ensemble de l'activité de la plateforme — Administration</p>
      </div>

      <div className="quick">
        <div className="quick-title">Actions rapides</div>
        <div className="quick-row">
          <button className="quick-btn primary" onClick={() => navigate('/admin/ressources')}>
            <IconSearch size={16} /> Ressources
          </button>
          <button className="quick-btn" onClick={() => navigate('/admin/publier')}>
            <IconUpload size={16} /> Publier
          </button>
          <button className="quick-btn" onClick={() => navigate('/admin/controle')}>
            <IconSliders size={16} /> Centre de contrôle
          </button>
          <button className="quick-btn" onClick={() => navigate('/admin/utilisateurs')}>
            <IconUsers size={16} /> Utilisateurs
          </button>
          <button className="quick-btn" onClick={() => {
            const el = document.getElementById('rapport-complet') || document.getElementById('rapport-activite');
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}>
            <IconDownload size={16} /> Rapport complet
          </button>
        </div>
      </div>

      <div className="stats-row" style={{ marginTop: 16 }}>
        <StatCard icon={IconBook} value={t.ressources} label="Ressources" tone="red" />
        <StatCard icon={IconUsers} value={t.utilisateurs} label="Utilisateurs" tone="orange" />
        <StatCard icon={IconBell} value={t.commentaires} label="Commentaires" tone="blue" />
        <StatCard icon={IconCap} value={t.filieres} label="Filières" tone="green" />
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

      <ActivityPanel />
    </div>
  );
}
