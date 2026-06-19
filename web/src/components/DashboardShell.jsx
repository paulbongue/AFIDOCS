import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Topbar from './Topbar';

// Coquille commune des espaces (étudiant / délégué / admin) :
// barre supérieure + barre latérale qui devient un menu hamburger dépliable
// sur mobile, + zone de contenu. Reçoit la navigation (NavLink) en children.
export default function DashboardShell({ profilePath, children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // On referme le tiroir à chaque navigation.
  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <>
      <Topbar profilePath={profilePath} menuOpen={open} onMenu={() => setOpen((o) => !o)} />
      <div className="shell">
        <aside className={'sidebar' + (open ? ' open' : '')}>{children}</aside>
        {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}
        <main className="content"><Outlet /></main>
      </div>
    </>
  );
}
