import React from 'react';
import { NavLink } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import { useAuth } from '../context/AuthContext';
import { IconDashboard, IconUpload, IconFolder, IconBook, IconUser, IconCap, IconChat, IconMegaphone, IconStar } from '../components/Icons';

const link = ({ isActive }) => 'nav-item' + (isActive ? ' active' : '');

export default function DelegueLayout() {
  const { user } = useAuth();
  return (
    <DashboardShell profilePath="/delegue/profil">
      <div className="group-title">NAVIGATION</div>
      <NavLink to="/delegue" end className={link}><IconDashboard /><span>Tableau de bord</span></NavLink>
      <NavLink to="/delegue/publier" className={link}><IconUpload /><span>Publier une ressource</span></NavLink>
      <NavLink to="/delegue/mes-ressources" className={link}><IconFolder /><span>Mes ressources</span></NavLink>
      <NavLink to="/delegue/ressources" className={link}><IconBook /><span>Toutes les ressources</span></NavLink>
      <NavLink to="/delegue/evaluations" className={link}><IconStar /><span>Évaluer les enseignants</span></NavLink>

      <div className="group-title">ÉCHANGES</div>
      <NavLink to="/delegue/classe" className={link}><IconChat /><span>Ma classe</span></NavLink>
      <NavLink to="/delegue/annonces" className={link}><IconMegaphone /><span>Annonces</span></NavLink>

      <div className="group-title">MON COMPTE</div>
      <NavLink to="/delegue/profil" className={link}><IconUser /><span>Profil</span></NavLink>

      {user?.filiere && (
        <>
          <div className="group-title">MA CLASSE</div>
          <div className="nav-item" style={{ cursor: 'default' }}>
            <IconCap /><span>{user.filiere.code}{user.niveau ? ` · ${user.niveau.nom}` : ''}</span>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
