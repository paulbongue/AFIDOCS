import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function homeFor(role) {
  return role === 'admin' ? '/admin' : role === 'delegue' ? '/delegue' : '/etudiant';
}

export default function LoginPage() {
  const { login, verifyOtp, resendOtp, googleLogin, user } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Étape OTP (double authentification par e-mail).
  const [step, setStep] = useState('creds'); // 'creds' | 'otp'
  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [info, setInfo] = useState('');

  // Bouton « Se connecter avec Google » (Google Identity Services).
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || step !== 'creds') return undefined;
    let cancelled = false;

    function render() {
      if (cancelled || !window.google?.accounts?.id || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp) => {
          try {
            const u = await googleLogin(resp.credential);
            navigate(homeFor(u.role), { replace: true });
          } catch (err) {
            setError(err?.response?.data?.errors?.email?.[0]
              || err?.response?.data?.message
              || 'Connexion Google impossible.');
          }
        },
      });
      googleBtnRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline', size: 'large', width: 320, text: 'signin_with', locale: 'fr',
      });
    }

    if (window.google?.accounts?.id) {
      render();
      return () => { cancelled = true; };
    }

    let s = document.getElementById('gsi-client');
    if (!s) {
      s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true; s.defer = true; s.id = 'gsi-client';
      document.body.appendChild(s);
    }
    s.addEventListener('load', render);
    return () => { cancelled = true; s.removeEventListener('load', render); };
  }, [step]);

  // Déjà connecté → atterrit sur la page d'accueil de l'espace.
  if (user) {
    return <Navigate to={homeFor(user.role)} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await login(email.trim().toLowerCase(), password);
      if (res.otpRequired) {
        setMaskedEmail(res.maskedEmail || '');
        setStep('otp');
        setInfo('Un code de vérification vient de vous être envoyé par e-mail.');
      } else {
        navigate(homeFor(res.user.role), { replace: true });
      }
    } catch (err) {
      setError(err?.response?.data?.message
        || err?.response?.data?.errors?.email?.[0]
        || "Connexion impossible. Vérifiez vos identifiants et l'adresse du serveur.");
    } finally {
      setLoading(false);
    }
  }

  async function onVerify(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const u = await verifyOtp(email.trim().toLowerCase(), code.trim(), remember);
      navigate(homeFor(u.role), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.errors?.code?.[0]
        || err?.response?.data?.message
        || 'Code invalide. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setError('');
    setInfo('');
    try {
      await resendOtp(email.trim().toLowerCase());
      setInfo('Un nouveau code vient de vous être envoyé.');
    } catch (err) {
      setError(err?.response?.data?.errors?.code?.[0]
        || err?.response?.data?.message
        || 'Impossible de renvoyer le code pour le moment.');
    }
  }

  function backToCreds() {
    setStep('creds');
    setCode('');
    setError('');
    setInfo('');
  }

  return (
    <div className="login-wrap">
      <div className="login-left">
        <div className="login-brand">
          <Link to="/" aria-label="Retour à l'accueil">
            <img src="/logo-afi.png" alt="AFI-L'UE" />
          </Link>
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
        {step === 'creds' ? (
          <form className="login-card" onSubmit={onSubmit}>
            <Link to="/" className="login-back">← Retour à l'accueil</Link>
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

            {GOOGLE_CLIENT_ID && (
              <>
                <div className="login-or"><span>ou</span></div>
                <div ref={googleBtnRef} className="login-google" />
                <p className="login-google-note">
                  Réservé aux comptes ayant une adresse e-mail de sécurité confirmée.
                </p>
              </>
            )}
          </form>
        ) : (
          <form className="login-card" onSubmit={onVerify}>
            <button type="button" className="login-back" onClick={backToCreds}>← Modifier l'identifiant</button>
            <div className="login-card-head">
              <h2>Vérification</h2>
              <p className="muted">
                Saisissez le code à 6 chiffres envoyé à {maskedEmail || 'votre adresse e-mail'}.
              </p>
            </div>

            <label className="field">Code de vérification</label>
            <input
              className="input login-otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              autoFocus
            />

            <label className="login-remember">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>Se souvenir de cet appareil (30 jours)</span>
            </label>

            {info && <div className="login-info">{info}</div>}
            {error && <div className="login-err">{error}</div>}

            <button className="btn btn-red" style={{ width: '100%', marginTop: 18 }} disabled={loading}>
              {loading ? 'Vérification…' : 'Vérifier et se connecter'}
            </button>

            <button type="button" className="login-resend" onClick={onResend}>
              Renvoyer le code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
