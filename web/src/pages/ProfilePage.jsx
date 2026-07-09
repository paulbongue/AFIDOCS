import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import Badge from '../components/Badge';
import PasswordInput from '../components/PasswordInput';
import { ROLE_LABEL, initials } from '../theme';

// Section dépliable (composant stable au niveau module : le contenu — dont les
// champs mot de passe — ne se remonte pas à chaque frappe).
function Section({ id, title, open, onToggle, children }) {
  const isOpen = open === id;
  return (
    <div className={'collapse' + (isOpen ? ' open' : '')}>
      <button type="button" className="collapse-head" onClick={() => onToggle(id)} aria-expanded={isOpen}>
        <span>{title}</span>
        <span className="collapse-chev">▾</span>
      </button>
      {isOpen && <div className="collapse-body">{children}</div>}
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState('info'); // section dépliée (une à la fois)
  const [pwd, setPwd] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  // E-mail de sécurité (OTP)
  const [secEmail, setSecEmail] = useState('');
  const [secCode, setSecCode] = useState('');
  const [secStep, setSecStep] = useState('idle'); // 'idle' | 'sent'
  const [secMsg, setSecMsg] = useState(null);
  const [secBusy, setSecBusy] = useState(false);

  const toggle = (id) => setOpen((o) => (o === id ? null : id));

  async function sendContactCode(e) {
    e.preventDefault();
    setSecMsg(null);
    setSecBusy(true);
    try {
      const { data } = await client.post('/me/contact-email', { email: secEmail.trim().toLowerCase() });
      setSecStep('sent');
      setSecMsg({ type: 'ok', text: `Code envoyé à ${data.pending}. Consultez cette boîte e-mail.` });
    } catch (err) {
      setSecMsg({ type: 'err', text: err?.response?.data?.errors?.email?.[0] || err?.response?.data?.message || 'Envoi impossible.' });
    } finally {
      setSecBusy(false);
    }
  }

  async function confirmContactCode(e) {
    e.preventDefault();
    setSecMsg(null);
    setSecBusy(true);
    try {
      const { data } = await client.post('/me/contact-email/confirm', { code: secCode.trim() });
      updateUser(data.user);
      setSecStep('idle');
      setSecEmail('');
      setSecCode('');
      setSecMsg({ type: 'ok', text: 'Adresse e-mail de sécurité confirmée. La double authentification est active pour ce compte.' });
    } catch (err) {
      setSecMsg({ type: 'err', text: err?.response?.data?.errors?.code?.[0] || err?.response?.data?.message || 'Code invalide.' });
    } finally {
      setSecBusy(false);
    }
  }

  // Confirmation en un clic d'une adresse pré-renseignée par l'administration.
  async function confirmPending() {
    setSecMsg(null);
    setSecBusy(true);
    try {
      const { data } = await client.post('/me/contact-email/confirm-pending');
      updateUser(data.user);
      setSecMsg({ type: 'ok', text: 'Adresse e-mail de sécurité confirmée.' });
    } catch (err) {
      setSecMsg({ type: 'err', text: err?.response?.data?.message || 'Confirmation impossible.' });
    } finally {
      setSecBusy(false);
    }
  }

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

      {user?.must_change_password && (
        <div className="card mt" style={{ borderColor: 'var(--red)', background: 'var(--accent-soft)' }}>
          <b>Veuillez changer votre mot de passe.</b> Votre compte a été créé avec un mot de passe par défaut ;
          remplacez-le dans la section « Sécurité — Mot de passe » ci-dessous pour sécuriser votre accès.
        </div>
      )}

      <div className="collapse-group">
        <Section id="info" title="Informations personnelles" open={open} onToggle={toggle}>
          <div className="spread"><span className="muted">Nom d'utilisateur</span><b>{user?.name}</b></div>
          <div className="spread mt"><span className="muted">Statut</span><b>{ROLE_LABEL[user?.role] || user?.role}</b></div>
          {user?.filiere && (
            <div className="spread mt"><span className="muted">Filière</span><b>{user.filiere.code} — {user.filiere.nom}</b></div>
          )}
          {user?.niveau && (
            <div className="spread mt"><span className="muted">Niveau / Classe</span><b>{user.filiere?.code} · {user.niveau.nom}</b></div>
          )}
        </Section>

        <Section id="security" title="Sécurité — Mot de passe" open={open} onToggle={toggle}>
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

        <Section id="secmail" title="E-mail de sécurité (double authentification)" open={open} onToggle={toggle}>
          <p className="muted" style={{ marginTop: 0 }}>
            Cette adresse e-mail <b>réelle</b> reçoit votre code de connexion à usage unique.
            Elle ne remplace pas votre identifiant ({user?.email}) — elle sert uniquement à la sécurité.
          </p>

          {user?.contact_email && (
            <div className="spread mt">
              <span className="muted">Adresse confirmée</span>
              <b style={{ color: 'var(--success)' }}>✓ {user.contact_email}</b>
            </div>
          )}
          {user?.contact_email_awaiting_confirm && (
            <div className="mt" style={{ background: 'var(--accent-soft)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
              <div>Une adresse e-mail a été renseignée par l'administration : <b>{user.contact_email_pending}</b>. Confirmez-la pour sécuriser votre compte.</div>
              <button type="button" className="btn btn-red mt" disabled={secBusy} onClick={confirmPending}>
                {secBusy ? 'Confirmation…' : 'Confirmer mon adresse en un clic'}
              </button>
            </div>
          )}
          {!user?.contact_email && !user?.contact_email_awaiting_confirm && user?.contact_email_pending && (
            <div className="mt muted">Une confirmation est en attente pour {user.contact_email_pending}.</div>
          )}

          {secStep === 'idle' ? (
            <form onSubmit={sendContactCode}>
              <label className="field mt">{user?.contact_email ? 'Changer l’adresse e-mail de sécurité' : 'Ajouter une adresse e-mail de sécurité'}</label>
              <input className="input" type="email" value={secEmail} autoComplete="email"
                     onChange={(e) => setSecEmail(e.target.value)} placeholder="votre.adresse@exemple.com" />
              {secMsg && (
                <div style={{ marginTop: 12, color: secMsg.type === 'ok' ? 'var(--success)' : 'var(--red)' }}>{secMsg.text}</div>
              )}
              <button className="btn btn-red mt" disabled={secBusy || !secEmail}>
                {secBusy ? 'Envoi…' : 'Envoyer un code de confirmation'}
              </button>
            </form>
          ) : (
            <form onSubmit={confirmContactCode}>
              <label className="field mt">Code de confirmation reçu par e-mail</label>
              <input className="input login-otp-input" type="text" inputMode="numeric" maxLength={6}
                     value={secCode} autoFocus
                     onChange={(e) => setSecCode(e.target.value.replace(/\D/g, ''))} placeholder="••••••" />
              {secMsg && (
                <div style={{ marginTop: 12, color: secMsg.type === 'ok' ? 'var(--success)' : 'var(--red)' }}>{secMsg.text}</div>
              )}
              <div className="row mt" style={{ gap: 10 }}>
                <button className="btn btn-red" disabled={secBusy || secCode.length < 6}>
                  {secBusy ? 'Vérification…' : 'Confirmer'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => { setSecStep('idle'); setSecCode(''); setSecMsg(null); }}>
                  Annuler
                </button>
              </div>
            </form>
          )}
        </Section>

        <Section id="devices" title="Appareils connectés" open={open} onToggle={toggle}>
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
