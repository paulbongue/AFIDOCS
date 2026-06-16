import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconLayers, IconDownload, IconBell, IconEye, IconLock, IconUsers,
} from '../components/Icons';

const FEATURES = [
  { icon: IconLayers, t: 'Organisé par filière et classe', d: 'Chaque ressource est rangée par filière, niveau et matière. On trouve ce qu’il faut en un clin d’œil.' },
  { icon: IconDownload, t: 'Téléchargement & hors-ligne', d: 'Téléchargez vos cours et consultez-les sans connexion, où que vous soyez.' },
  { icon: IconBell, t: 'Notifications en temps réel', d: 'Soyez prévenu dès qu’une nouvelle ressource est publiée pour votre classe.' },
  { icon: IconEye, t: 'Aperçu intégré', d: 'Visualisez PDF et images directement dans la plateforme, sans rien installer.' },
  { icon: IconLock, t: 'Accès sécurisé', d: 'Connexion par compte, chiffrement HTTPS et limite d’appareils par utilisateur.' },
  { icon: IconUsers, t: 'Délégués & administration', d: 'Les délégués publient pour leur classe ; l’administration garde le contrôle.' },
];

// Grands domaines stables (la liste précise des filières peut évoluer en cours d'usage).
const DOMAINES = [
  'Gestion & Management',
  'Informatique & Réseaux',
  'Banque, Finance & Assurance',
  'Industrie & QHSE',
  'Communication & Langues',
];

const STATS = [
  { v: 'Plusieurs', l: 'Filières' },
  { v: 'PDF · Word · PPT…', l: 'Tous formats' },
  { v: 'Hors-ligne', l: 'Cours téléchargés' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const login = () => navigate('/login');

  return (
    <div className="landing">
      <header className="lp-nav">
        <div className="lp-brand">
          <img src="/logo-afi.png" alt="AFI-L'UE" />
          <span className="lp-wordmark">AFI-DOCS</span>
        </div>
        <button className="btn btn-red" onClick={login}>Se connecter</button>
      </header>

      <section className="lp-hero">
        <span className="lp-badge">Plateforme de ressources pédagogiques · AFI-L'UE</span>
        <h1>Accédez à tous vos <span>supports de cours</span> en un seul endroit</h1>
        <p>
          Téléchargez, consultez et organisez vos ressources pédagogiques en toute simplicité —
          la documentation de l'Université AFI, disponible partout, même hors connexion.
        </p>
        <div className="lp-hero-cta">
          <button className="btn btn-red" onClick={login}>Se connecter</button>
          <a className="btn btn-ghost" href="#features">Découvrir la plateforme</a>
        </div>

        <div className="lp-stats">
          {STATS.map((s) => (
            <div key={s.l} className="lp-stat">
              <div className="lp-stat-v">{s.v}</div>
              <div className="lp-stat-l">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="lp-section">
        <div className="lp-section-head">
          <h2>Tout ce dont vous avez besoin</h2>
          <p className="muted">Une plateforme pensée pour les étudiants, les délégués et l'administration.</p>
        </div>
        <div className="lp-grid">
          {FEATURES.map(({ icon: Icon, t, d }) => (
            <div key={t} className="lp-feature">
              <div className="lp-feature-ico"><Icon size={22} /></div>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section lp-download">
        <div className="lp-download-card">
          <h2>📱 Application Android</h2>
          <p>
            Installez l'application pour consulter vos cours <b>même hors connexion</b>,
            recevoir les notifications et lire vos documents (PDF, images) directement dans l'app.
          </p>
          <a className="btn btn-red" href="/AFI-DOCS.apk" download>⬇ Télécharger l'application (Android)</a>
          <div className="lp-download-steps">
            <span>1. Téléchargez le fichier <b>.apk</b> sur votre téléphone.</span>
            <span>2. Ouvrez-le, puis autorisez « installer des applications inconnues » si demandé.</span>
            <span>3. Installez, puis connectez-vous avec votre compte AFI.</span>
          </div>
          <p className="lp-download-note">Compatible Android uniquement. Version iOS non disponible pour le moment.</p>
        </div>
      </section>

      <section className="lp-section lp-filieres">
        <div className="lp-section-head">
          <h2>Nos domaines de formation</h2>
          <p className="muted">Les filières de l'AFI couvrent plusieurs grands domaines, chacun avec ses classes et ses matières.</p>
        </div>
        <div className="lp-chips">
          {DOMAINES.map((d) => <span key={d} className="lp-chip">{d}</span>)}
        </div>
      </section>

      <section className="lp-cta">
        <h2>Prêt à accéder à vos ressources pédagogiques ?</h2>
        <p>Connectez-vous avec votre compte AFI pour retrouver tous vos cours.</p>
        <button className="btn btn-light" onClick={login}>Se connecter</button>
      </section>

      <footer className="lp-footer">
        <div className="lp-foot-brand">
          <img src="/logo-afi.png" alt="AFI-L'UE" />
          <span>AFI-DOCS — L'Université de l'Entreprise</span>
        </div>
        <div className="lp-foot-note">© {new Date().getFullYear()} AFI-DOCS · Plateforme de ressources pédagogiques.</div>
      </footer>
    </div>
  );
}
