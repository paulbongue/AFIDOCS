import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import Badge from '../components/Badge';
import { ROLE_LABEL, initials } from '../theme';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pwd, setPwd] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function changePassword(e) {
    e.preventDefault();
    setMsg(null);
    if (pwd.password !== pwd.password_confirmation) {
      setMsg({ type: 'err', text: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }
    setBusy(true);
    try {
      await client.post('/me/password', pwd);
      setMsg({ type: 'ok', text: 'Mot de passe mis à jour.' });
      setPwd({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      setMsg({ type: 'err', text: err?.response?.data?.message || 'Échec de la mise à jour.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div>
      <div className="page-title">Profil</div>

      <div className="row" style={{ marginBottom: 18 }}>
        <span className="avatar" style={{ width: 60, height: 60, fontSize: 24 }}>{initials(user?.name)}</span>
        <div>
          <h2>{user?.name}</h2>
          <div className="muted">{user?.email}</div>
          <div className="row mt" style={{ gap: 8 }}>
            <span>{ROLE_LABEL[user?.role] || user?.role}</span>
            {user?.filiere && <Badge code={user.filiere.code} couleur={user.filiere.couleur} />}
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <h3>Informations personnelles</h3>
        <div className="spread mt"><span className="muted">Nom d'utilisateur</span><b>{user?.name}</b></div>
        <div className="spread mt"><span className="muted">Statut</span><b>{ROLE_LABEL[user?.role] || user?.role}</b></div>
        {user?.filiere && (
          <div className="spread mt"><span className="muted">Filière</span><b>{user.filiere.code} — {user.filiere.nom}</b></div>
        )}
        {user?.niveau && (
          <div className="spread mt"><span className="muted">Niveau / Classe</span><b>{user.filiere?.code} · {user.niveau.nom}</b></div>
        )}
      </div>

      <form className="card mt" style={{ maxWidth: 560 }} onSubmit={changePassword}>
        <h3>Sécurité — Modifier mon mot de passe</h3>
        <label className="field">Mot de passe actuel</label>
        <input className="input" type="password" value={pwd.current_password}
               onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })} />
        <label className="field">Nouveau mot de passe</label>
        <input className="input" type="password" value={pwd.password}
               onChange={(e) => setPwd({ ...pwd, password: e.target.value })} />
        <label className="field">Confirmer le nouveau mot de passe</label>
        <input className="input" type="password" value={pwd.password_confirmation}
               onChange={(e) => setPwd({ ...pwd, password_confirmation: e.target.value })} />
        {msg && (
          <div style={{ marginTop: 12, color: msg.type === 'ok' ? 'var(--success)' : 'var(--red)' }}>
            {msg.text}
          </div>
        )}
        <button className="btn btn-red mt" disabled={busy}>{busy ? 'Enregistrement…' : 'Mettre à jour'}</button>
      </form>

      <button className="btn btn-danger mt" onClick={handleLogout}>Se déconnecter</button>
    </div>
  );
}
