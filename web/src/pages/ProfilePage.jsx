import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import Badge from '../components/Badge';
import PasswordInput from '../components/PasswordInput';
import { ROLE_LABEL, initials } from '../theme';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState('info'); // section dépliée (une à la fois)
  const [pwd, setPwd] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const toggle = (id) => setOpen((o) => (o === id ? null : id));

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

  async function logoutOthers() {
    setMsg(null);
    try {
      const { data } = await client.post('/logout-others');
      setMsg({ type: 'ok', text: `Déconnecté de ${data.revoked ?? 0} autre(s) appareil(s).` });
    } catch (_) {
      setMsg({ type: 'err', text: 'Action impossible.' });
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  function Section({ id, title, children }) {
    const isOpen = open === id;
    return (
      <div className={'collapse' + (isOpen ? ' open' : '')}>
        <button type="button" className="collapse-head" onClick={() => toggle(id)} aria-expanded={isOpen}>
          <span>{title}</span>
          <span className="collapse-chev">▾</span>
        </button>
        {isOpen && <div className="collapse-body">{children}</div>}
      </div>
    );
  }

  return (
    <div className="profile-wrap">
      <div className="page-title">Profil</div>

      <div className="profile-head">
        <span className="avatar" style={{ width: 60, height: 60, fontSize: 24 }}>{initials(user?.name)}</span>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0 }}>{user?.name}</h2>
          <div className="muted">{user?.email}</div>
          <div className="row mt" style={{ gap: 8 }}>
            <span>{ROLE_LABEL[user?.role] || user?.role}</span>
            {user?.filiere && <Badge code={user.filiere.code} couleur={user.filiere.couleur} />}
          </div>
        </div>
      </div>

      <div className="collapse-group">
        <Section id="info" title="Informations personnelles">
          <div className="spread"><span className="muted">Nom d'utilisateur</span><b>{user?.name}</b></div>
          <div className="spread mt"><span className="muted">Statut</span><b>{ROLE_LABEL[user?.role] || user?.role}</b></div>
          {user?.filiere && (
            <div className="spread mt"><span className="muted">Filière</span><b>{user.filiere.code} — {user.filiere.nom}</b></div>
          )}
          {user?.niveau && (
            <div className="spread mt"><span className="muted">Niveau / Classe</span><b>{user.filiere?.code} · {user.niveau.nom}</b></div>
          )}
        </Section>

        <Section id="security" title="Sécurité — Mot de passe">
          <form onSubmit={changePassword}>
            <label className="field">Mot de passe actuel</label>
            <PasswordInput value={pwd.current_password}
                   onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })} />
            <label className="field">Nouveau mot de passe</label>
            <PasswordInput value={pwd.password}
                   onChange={(e) => setPwd({ ...pwd, password: e.target.value })} />
            <label className="field">Confirmer le nouveau mot de passe</label>
            <PasswordInput value={pwd.password_confirmation}
                   onChange={(e) => setPwd({ ...pwd, password_confirmation: e.target.value })} />
            {msg && (
              <div style={{ marginTop: 12, color: msg.type === 'ok' ? 'var(--success)' : 'var(--red)' }}>{msg.text}</div>
            )}
            <button className="btn btn-red mt" disabled={busy}>{busy ? 'Enregistrement…' : 'Mettre à jour'}</button>
          </form>
        </Section>

        <Section id="devices" title="Appareils connectés">
          <p className="muted" style={{ marginTop: 0 }}>
            Un compte peut être connecté sur <b>3 appareils</b> au maximum. Au-delà, l'appareil le plus
            ancien est déconnecté automatiquement. Vous pouvez aussi déconnecter manuellement les autres.
          </p>
          {msg && (
            <div style={{ marginTop: 8, color: msg.type === 'ok' ? 'var(--success)' : 'var(--red)' }}>{msg.text}</div>
          )}
          <button type="button" className="btn btn-ghost mt" onClick={logoutOthers}>
            Déconnecter les autres appareils
          </button>
        </Section>
      </div>

      <button className="btn btn-danger mt" onClick={handleLogout}>Se déconnecter</button>
    </div>
  );
}
