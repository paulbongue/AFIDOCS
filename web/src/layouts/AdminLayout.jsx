import React from 'react';
import { NavLink } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';

const link = ({ isActive }) => 'nav-item' + (isActive ? ' active' : '');

export default function AdminLayout() {
  return (
    <DashboardShell profilePath="/admin/profil">
      <div className="group-title">ADMINISTRATION</div>
      <NavLink to="/admin" end className={link}>▦ Tableau de bord</NavLink>
      <NavLink to="/admin/publier" className={link}>⬆ Publier une ressource</NavLink>
      <NavLink to="/admin/controle" className={link}>⚙ Centre de contrôle</NavLink>
      <NavLink to="/admin/pedagogie" className={link}>▥ Gestion pédagogique</NavLink>
      <NavLink to="/admin/utilisateurs" className={link}>◐ Utilisateurs</NavLink>
      <NavLink to="/admin/moderation" className={link}>⚑ Modération</NavLink>

      <div className="group-title">MON COMPTE</div>
      <NavLink to="/admin/profil" className={link}>◍ Profil</NavLink>
    </DashboardShell>
  );
}
