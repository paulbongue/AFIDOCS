import React from 'react';
import { NavLink } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import { useAuth } from '../context/AuthContext';

const link = ({ isActive }) => 'nav-item' + (isActive ? ' active' : '');

export default function StudentLayout() {
  const { user } = useAuth();
  return (
    <DashboardShell profilePath="/etudiant/profil">
      <div className="group-title">NAVIGATION</div>
      <NavLink to="/etudiant" end className={link}>▦ Tableau de bord</NavLink>
      <NavLink to="/etudiant/ressources" className={link}>▭ Ressources</NavLink>
      <NavLink to="/etudiant/recherche" className={link}>⌕ Recherche</NavLink>

      <div className="group-title">MON COMPTE</div>
      <NavLink to="/etudiant/profil" className={link}>◍ Profil</NavLink>

      {user?.filiere && (
        <>
          <div className="group-title">MA FILIÈRE</div>
          <div className="nav-item" style={{ cursor: 'default' }}>
            ‹/› {user.filiere.code}{user.niveau ? ` · ${user.niveau.nom}` : ''}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
