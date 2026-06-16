import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from '../theme';
import NotificationBell from './NotificationBell';

const ROLE_LABEL = { admin: 'ADMIN', delegue: 'DÉLÉGUÉ', etudiant: 'ÉTUDIANT' };

// Barre supérieure rouge : menu hamburger (mobile) + logo + wordmark + chip utilisateur.
export default function Topbar({ profilePath, onMenu, menuOpen }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = ROLE_LABEL[user?.role];

  return (
    <header className="topbar">
      <div className="brand-left">
        {onMenu && (
          <button className="menu-btn" onClick={onMenu}
                  aria-label="Menu" aria-expanded={!!menuOpen}>
            {menuOpen ? '✕' : '☰'}
          </button>
        )}
        <img src="/logo-afi.png" alt="AFI-L'UE" className="brand-logo" />
        <span className="brand-name">AFI-DOCS</span>
      </div>

      <div className="right">
        <NotificationBell />
        <button className="user-chip" onClick={() => navigate(profilePath)} title="Mon profil">
          <span className="avatar user-chip-av">{initials(user?.name)}</span>
          <span className="user-chip-name">{user?.name}</span>
          {role && <span className="user-chip-role">{role}</span>}
        </button>
      </div>
    </header>
  );
}
