import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';

const link = ({ isActive }) => 'nav-item' + (isActive ? ' active' : '');

export default function DelegueLayout() {
  const { user } = useAuth();
  return (
    <>
      <Topbar profilePath="/delegue/profil" />
      <div className="shell">
        <aside className="sidebar">
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
        </aside>
        <main className="content"><Outlet /></main>
      </div>
    </>
  );
}
