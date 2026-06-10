import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Garde de route : exige une authentification + un rôle autorisé.
export default function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="empty">Chargement…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    // Rôle non autorisé : on renvoie vers l'espace correspondant au rôle.
    const home = user.role === 'admin' ? '/admin' : user.role === 'delegue' ? '/delegue' : '/etudiant';
    return <Navigate to={home} replace />;
  }
  return children;
}
