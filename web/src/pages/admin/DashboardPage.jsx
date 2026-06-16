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
      <div className="page-title">Tableau de bord — Administration</div>

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
            document.getElementById('rapport-activite')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            <IconDownload size={16} /> Rapport complet
          </button>
     