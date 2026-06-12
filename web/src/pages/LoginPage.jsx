import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Déjà connecté → atterrit directement sur la liste des ressources.
  if (user) {
    const home = user.role === 'admin' ? '/admin/ressources'
      : user.role === 'delegue' ? '/delegue/ressources' : '/etudiant/ressources';
    return <Navigate to={home} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(email.trim().toLowerCase(), password);
      const home = u.role === 'admin' ? '/admin/ressources'
        : u.role === 'delegue' ? '/delegue/ressources' : '/etudiant/ressources';
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
        <div>
          <img src="/logo-afi.png" alt="AFI-L'UE" style={{ height: 60, display: 'block' }} />
          <div className="afi-sub" style={{ color: 'rgba(255,255,255,.85)', marginTop: 8 }}>
            L'Université de l'Entreprise
          </div>
        </div>
        <div style={{ marginTop: 60 }}>
          <div className="big">AFI-DOCS</div>
          <div className="tag">Votre Documentation pour un meilleur apprentissage.</div>
        </div>
      </div>

      <div className="login-right">
        <form className="login-card" onSubmit={onSubmit}>
          <h2 style={{ marginBottom: 6 }}>Connexion</h2>
          <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>Accédez à votre espace.</p>

          <label className="field">Identifiant</label>
          <input className="input" type="email" value={email}
                 onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@afi.sn" />

          <label className="field">Mot de passe</label>
          <input className="input" type="password" value={password}
                 onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />

          {error && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>{error}</div>}

          <button className="btn btn-red" style={{ width: '100%', marginTop: 20 }} disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>

          <p className="muted" style={{ fontSize: 12, marginTop: 18, textAlign: 'center', lineHeight: 1.5 }}>
            Démo (mot de passe : password)<br />
            admin@afi.sn · delegue.srt@afi.sn · etudiant.srt@afi.sn
          </p>
        </form>
      </div>
    </div>
  );
}
