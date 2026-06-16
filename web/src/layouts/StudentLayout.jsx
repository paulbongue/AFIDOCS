import React from 'react';
import { NavLink } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import { useAuth } from '../context/AuthContext';
import { IconDashboard, IconBook, IconSearch, IconUser, IconCap, IconChat, IconMegaphone } from '../components/Icons';

const link = ({ isActive }) => 'nav-item' + (isActive ? ' active' : '');

export default function StudentLayout() {
  const { user } = useAuth();
  return (
    <DashboardShell profilePath="/etudiant/profil">
      <div className="group-title">NAVIGATION</div>
      <NavLink to="/etudiant" end className={link}><IconDashboard /><span>Tableau de bord</span></NavLink>
      <NavLink to="/etudiant/ressources" className={link}><IconBook /><span>Ressources</span></NavLink>
      <NavLink to="/etudiant/recherche" className={link}><IconSearch /><span>Recherche</span></NavLink>

      <div className="group-title">ÉCHANGES</div>
      <NavLink to="/etudiant/classe" className={link}><IconChat /><span>Ma classe</span></NavLink>
      <NavLink to="/etudiant/annonces" className={link}><IconMegaphone /><span>Annonces</span></NavLink>

      <div className="group-title">MON COMPTE</div>
      <NavLink to="/etudiant/profil" className={link}><IconUser /><span>Profil</span></NavLink>

      {user?.filiere && (
        <>
          <