import React from 'react';
import { NavLink } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import { useAuth } from '../context/AuthContext';

const link = ({ isActive }) => 'nav-item' + (isActive ? ' active' : '');

export default function DelegueLayout() {
  const { user } = useAuth();
  return (
    <DashboardShell profilePath="/delegue/profil">
      <div className="group-title">NAVIGATION</div>
      <NavLink to="/delegue" end className={link}>▦ Tableau de bord</NavLink>
      <NavLink to="/delegue/publier" className={link}>⬆ Publier une ressource</NavLink>
      <NavLink to="/delegue/mes-ressources" className={link}>▤ Mes ressources</NavLink>
      <NavLink to="/delegue/ressources" className={link}>▭ Toutes les ressources</NavLink>

      <div className="group-title">MON COMPTE</div>
      <NavLink to="/delegue/profil" className={link}>◍ Profil</NavLink>

      {user?.filiere && (
        <>
          <div className="group-title">MA CLASSE</div>
          <div className="nav-item" style={{ cursor: 'default' }}>
            ‹/› {user.filiere.code}{user.niveau ? ` · ${user.niveau.nom}` : ''}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
