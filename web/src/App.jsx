import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import RequireRole from './components/RequireRole';

import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ResourceDetailPage from './pages/ResourceDetailPage';

import StudentLayout from './layouts/StudentLayout';
import DelegueLayout from './layouts/DelegueLayout';
import AdminLayout from './layouts/AdminLayout';

import StudentDashboard from './pages/etudiant/DashboardPage';
import ResourcesPage from './pages/etudiant/ResourcesPage';
import SearchPage from './pages/etudiant/SearchPage';

import DelegueDashboard from './pages/delegue/DashboardPage';
import PublishPage from './pages/delegue/PublishPage';
import MyResourcesPage from './pages/delegue/MyResourcesPage';

import AdminDashboard from './pages/admin/DashboardPage';
import PedagogiePage from './pages/admin/PedagogiePage';
import UsersPage from './pages/admin/UsersPage';
import ModerationPage from './pages/admin/ModerationPage';
import ControlCenterPage from './pages/admin/ControlCenterPage';
import AdminPublishPage from './pages/admin/PublishPage';

// Après connexion, on atterrit directement sur la liste des ressources
// (étudiant/délégué : leur classe en avant ; admin : toutes les ressources).
function Home() {
  const { user, loading } = useAuth();
  if (loading) return <div className="empty">Chargement…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/ressources" replace />;
  if (user.role === 'delegue') return <Navigate to="/delegue/ressources" replace />;
  return <Navigate to="/etudiant/ressources" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Home />} />

      {/* ----------------------- ESPACE ÉTUDIANT ----------------------- */}
      <Route
        path="/etudiant"
        element={<RequireRole roles={['etudiant']}><StudentLayout /></RequireRole>}
      >
        <Route index element={<StudentDashboard />} />
        <Route path="ressources" element={<ResourcesPage />} />
        <Route path="ressources/:id" element={<ResourceDetailPage />} />
        <Route path="recherche" element={<SearchPage />} />
        <Route path="profil" element={<ProfilePage />} />
      </Route>

      {/* ----------------------- ESPACE DÉLÉGUÉ ------------------------ */}
      <Route
        path="/delegue"
        element={<RequireRole roles={['delegue']}><DelegueLayout /></RequireRole>}
      >
        <Route index element={<DelegueDashboard />} />
        <Route path="publier" element={<PublishPage />} />
        <Route path="mes-ressources" element={<MyResourcesPage />} />
        <Route path="ressources" element={<ResourcesPage />} />
        <Route path="ressources/:id" element={<ResourceDetailPage />} />
        <Route path="profil" element={<ProfilePage />} />
      </Route>

      {/* ------------------------ ESPACE ADMIN ------------------------- */}
      <Route
        path="/admin"
        element={<RequireRole roles={['admin']}><AdminLayout /></RequireRole>}
      >
        <Route index element={<AdminDashboard />} />
        <Route path="ressources" element={<ResourcesPage />} />
        <Route path="publier" element={<AdminPublishPage />} />
        <Route path="controle" element={<ControlCenterPage />} />
        <Route path="pedagogie" element={<PedagogiePage />} />
        <Route path="utilisateurs" element={<UsersPage />} />
        <Route path="moderation" element={<ModerationPage />} />
        <Route path="ressources/:id" element={<ResourceDetailPage />} />
        <Route path="profil" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
