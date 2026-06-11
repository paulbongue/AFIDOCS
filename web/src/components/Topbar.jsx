import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from '../theme';
import NotificationBell from './NotificationBell';

// Barre supérieure rouge : menu hamburger (mobile) + logo + wordmark + avatar.
export default function Topbar({ profilePath, onMenu, menuOpen }) {
  const { user } = useAuth();
  const navigate = useNavigate();

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
      </div>

      <div className="wordmark">AFI-DOCS</div>

      <div className="right">
        <NotificationBell />
        <span style={{ fontSize: 14 }}>{user?.name}</span>
        <button
          onClick={() => navigate(profilePath)}
          title="Mon profil"
          style={{ border: 'none', background: 'transparent', padding: 0 }}
        >
          <span className="avatar" style={{ background: '#fff', color: 'var(--navy)' }}>
            {initials(user?.name)}
          </span>
        </button>
      </div>
    </header>
  );
}
