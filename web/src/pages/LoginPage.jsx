import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Déjà connecté → atterrit sur le tableau de bord / la page d'accueil de l'espace.
  if (user) {
    const home = user.role === 'admin' ? '/admin'
      : user.role === 'delegue' ? '/delegue' : '/etudiant';
    return <Navigate to={home} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(email.trim().toLowerCase(), password);
      const home = u.role === 'admin' ? '/admin'
        : u.role === 'delegue' ? '/delegue' : '/etudiant';
      navigate(home, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message
        || err?.response?.data?.errors?.email?.[0]
        || "Connexion impossible. Vérifiez vos identifiants et l'adresse du serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-left">
        <div className="login-brand">
          <img src="/logo-afi.png" alt="AFI-L'UE" />
        </div>

        <div className="login-hero">
          <h1>Accédez à tous vos <span>supports de cours</span> en un seul endroit</h1>
          <p>La documentation pédagogique d'AFI-L'UE, accessible partout — et disponible même hors connexion.</p>
          <ul className="login-feats">
            <li>Ressources organisées par filière et par classe</li>
            <li>Téléchargement et consultation hors-ligne</li>
            <li>Notifications des nouvelles publications</li>
          </ul>
        </div>

        <div className="login-foot">AFI-DOCS · L'Université de l'Entreprise</div>
      </div>

      <div className="login-right">
        <form className="login-card" onSubmit={onSubmit}>
          <div className="login-card-head">
            <h2>Connexion</h2>
            <p className="muted">Accédez à votre espace AFI-DOCS.</p>
          </div>

          <label className="field">Identifiant</label>
          <input className="input" type="email" value={email} autoComplete="username"
                 onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@afi.sn" />

          <label className="field">Mot de passe</label>
          <PasswordInput value={password} autoComplete="current-password"
                         onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />

          {error && <div className="login-err">{error}</div>}

          <button className="btn btn-red" style={{ width: '100%', marginTop: 22 }} disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
