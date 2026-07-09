import React from 'react';
import { NavLink } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import { IconDashboard, IconBook, IconUpload, IconSliders, IconLayers, IconUsers, IconShield, IconUser, IconMegaphone, IconStar } from '../components/Icons';

const link = ({ isActive }) => 'nav-item' + (isActive ? ' active' : '');

export default function AdminLayout() {
  return (
    <DashboardShell profilePath="/admin/profil">
      <div className="group-title">ADMINISTRATION</div>
      <NavLink to="/admin" end className={link}><IconDashboard /><span>Tableau de bord</span></NavLink>
      <NavLink to="/admin/ressources" className={link}><IconBook /><span>Ressources</span></NavLink>
      <NavLink to="/admin/publier" className={link}><IconUpload /><span>Publier une ressource</span></NavLink>
      <NavLink to="/admin/controle" className={link}><IconSliders /><span>Centre de contrôle</span></NavLink>
      <NavLink to="/admin/pedagogie" className={link}><IconLayers /><span>Gestion pédagogique</span></NavLink>
      <NavLink to="/admin/evaluations" className={link}><IconStar /><span>Évaluations enseignants</span></NavLink>
      <NavLink to="/admin/utilisateurs" className={link}><IconUsers /><span>Utilisateurs</span></NavLink>
      <NavLink to="/admin/moderation" className={link}><IconShield /><span>Modération</span></NavLink>

      <div className="group-title">ÉCHANGES</div>
      <NavLink to="/admin/annonces" className={link}><IconMegaphone /><span>Annonces</span></NavLink>

      <div className="group-title">MON COMPTE</div>
      <NavLink to="/admin/profil" className={link}><IconUser /><span>Profil</span></NavLink>
    </DashboardShell>
  );
}
