import React, { useState, useRef, useEffect } from 'react';

/*
 * Assistant d'aide AFI-DOCS — chatbot à base de règles (FAQ).
 * Aucune API externe : il répond à partir d'une base de connaissances locale
 * décrivant l'usage de la plateforme, par correspondance de mots-clés.
 */

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // enlève les accents
    .replace(/[^a-z0-9\s]/g, ' ');

// Base de connaissances : chaque entrée a des mots-clés et une réponse.
const FAQ = [
  {
    id: 'telecharger',
    q: 'Comment télécharger une ressource ?',
    keywords: ['telecharger', 'download', 'recuperer', 'cours', 'fichier', 'pdf', 'enregistrer'],
    a: "Ouvre la rubrique « Ressources », clique sur le document voulu puis sur « Télécharger ». Sur mobile, le fichier reste ensuite consultable hors connexion.",
  },
  {
    id: 'hors-ligne',
    q: 'Comment consulter hors connexion ?',
    keywords: ['hors', 'ligne', 'offline', 'connexion', 'internet', 'reseau', 'sans'],
    a: "Sur l'application mobile, tout document téléchargé est disponible dans l'onglet « Hors-ligne », même sans Internet. La consultation hors connexion n'existe que sur mobile.",
  },
  {
    id: 'recherche',
    q: 'Comment rechercher / filtrer une ressource ?',
    keywords: ['rechercher', 'recherche', 'trouver', 'filtre', 'filtrer', 'matiere', 'chercher', 'introuvable'],
    a: "Va dans « Recherche » : tu peux filtrer par matière, par type (cours, TP/TD, devoir, examen) et par niveau. Les résultats se limitent à ta filière et à ton niveau.",
  },
  {
    id: 'perimetre',
    q: 'Pourquoi je ne vois que certaines ressources ?',
    keywords: ['pourquoi', 'vois', 'voir', 'acces', 'perimetre', 'filiere', 'niveau', 'autres', 'limite', 'manque'],
    a: "Chaque étudiant accède aux ressources de SA filière, pour son niveau et les niveaux inférieurs. C'est normal de ne pas voir les autres filières ou les niveaux supérieurs.",
  },
  {
    id: 'commenter',
    q: 'Comment commenter une ressource ?',
    keywords: ['commenter', 'commentaire', 'avis', 'question', 'reagir', 'poster'],
    a: "Ouvre le détail d'une ressource : en bas, saisis ton message dans « Laisser un commentaire » puis « Envoyer ». Tu ne peux commenter que les ressources de ton périmètre.",
  },
  {
    id: 'evaluer',
    q: 'Comment évaluer un enseignant ?',
    keywords: ['evaluer', 'evaluation', 'noter', 'note', 'enseignant', 'prof', 'professeur', 'grille'],
    a: "Va dans « Évaluer les enseignants », choisis le module puis remplis la grille (15 critères sur 20). L'évaluation est anonyme et se fait une fois par module et par année.",
  },
  {
    id: 'notifications',
    q: 'Comment recevoir les notifications ?',
    keywords: ['notification', 'notif', 'cloche', 'alerte', 'push', 'prevenir', 'nouvelle', 'nouveau'],
    a: "La cloche en haut affiche les nouveautés (ressources, annonces, emploi du temps). Sur mobile, tu reçois aussi des notifications push, et un e-mail si ton adresse de sécurité est confirmée.",
  },
  {
    id: 'echanges',
    q: 'Où discuter avec ma classe ?',
    keywords: ['discuter', 'discussion', 'echange', 'classe', 'groupe', 'message', 'chat', 'camarade'],
    a: "Dans « Échanges », tu as la discussion de ta classe (réservée aux étudiants de ta filière et de ton niveau) et les annonces communes publiées par les délégués ou l'administration.",
  },
  {
    id: 'mot-de-passe',
    q: 'Comment changer mon mot de passe ?',
    keywords: ['mot', 'passe', 'password', 'oublie', 'changer', 'modifier', 'securite', 'connexion'],
    a: "Dans « Profil » → section « Sécurité — Mot de passe ». Si tu l'as oublié, contacte l'administration : elle peut le réinitialiser (tu devras le changer à la première connexion).",
  },
  {
    id: 'email-securite',
    q: "À quoi sert l'e-mail de sécurité ?",
    keywords: ['email', 'mail', 'securite', 'otp', 'code', 'double', 'authentification', 'confirmer'],
    a: "Dans « Profil » → « E-mail de sécurité », confirme une adresse réelle : elle reçoit le code de connexion à usage unique (double authentification) et les notifications par e-mail.",
  },
  {
    id: 'qui-publie',
    q: 'Qui publie les ressources ?',
    keywords: ['qui', 'publie', 'publier', 'delegue', 'ajouter', 'deposer', 'mettre'],
    a: "Les ressources sont publiées par le Délégué de ta classe (et l'administration). En tant qu'étudiant, tu les consultes et les télécharges, mais tu ne publies pas.",
  },
  {
    id: 'contact',
    q: 'Comment obtenir de l\'aide ?',
    keywords: ['aide', 'contact', 'probleme', 'bug', 'support', 'assistance', 'marche', 'plante'],
    a: "Pose ta question ici, ou rapproche-toi du Délégué de ta classe ou de l'administration de l'AFI-L'UE pour toute difficulté technique.",
  },
];

const GREETING = {
  from: 'bot',
  text: "Bonjour 👋 Je suis l'assistant AFI-DOCS. Pose-moi une question sur l'utilisation de la plateforme (télécharger, rechercher, évaluer, notifications…) ou choisis un sujet ci-dessous.",
};

// Sujets proposés au démarrage (raccourcis).
const SUGGESTIONS = ['telecharger', 'recherche', 'evaluer', 'hors-ligne', 'notifications', 'mot-de-passe'];

function findAnswer(text) {
  const t = norm(text);
  const words = new Set(t.split(/\s+/).filter((w) => w.length > 2));
  let best = null;
  let bestScore = 0;
  for (const item of FAQ) {
    let score = 0;
    for (const kw of item.keywords) {
      if (words.has(kw) || t.includes(kw)) score += 1;
    }
    if (score > bestScore) { bestScore = score; best = item; }
  }
  if (best && bestScore > 0) return best.a;
  return null;
}

export default function ChatbotAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open]);

  function reply(userText) {
    const answer = findAnswer(userText);
    setMessages((m) => [
      ...m,
      { from: 'user', text: userText },
      answer
        ? { from: 'bot', text: answer }
        : {
            from: 'bot',
            text: "Je n'ai pas de réponse toute prête à cette question. Essaie un des sujets proposés, ou contacte le Délégué de ta classe / l'administration.",
            suggest: true,
          },
    ]);
  }

  function onSend(e) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text) return;
    setInput('');
    reply(text);
  }

  function askSuggestion(id) {
    const item = FAQ.find((f) => f.id === id);
    if (item) reply(item.q);
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Assistant d'aide"
        style={{
          position: 'fixed', right: 20, bottom: 20, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: '#C0392B', color: '#fff', fontSize: 24, boxShadow: '0 6px 18px rgba(0,0,0,.25)',
        }}
      >
        {open ? '×' : '💬'}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed', right: 20, bottom: 88, zIndex: 1000, width: 340, maxWidth: 'calc(100vw - 40px)',
            height: 460, maxHeight: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column',
            background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,.28)',
            border: '1px solid #e5e7eb',
          }}
        >
          <div style={{ background: '#14213D', color: '#fff', padding: '12px 14px', fontWeight: 700 }}>
            Assistant AFI-DOCS
            <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>Aide à l'utilisation de la plateforme</div>
          </div>

          <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: 12, background: '#f6f7f9' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <div
                  style={{
                    maxWidth: '85%', padding: '8px 11px', borderRadius: 12, fontSize: 13.5, lineHeight: 1.4,
                    background: m.from === 'user' ? '#C0392B' : '#fff',
                    color: m.from === 'user' ? '#fff' : '#14213D',
                    border: m.from === 'user' ? 'none' : '1px solid #e5e7eb',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {/* Suggestions de sujets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {SUGGESTIONS.map((id) => {
                const item = FAQ.find((f) => f.id === id);
                if (!item) return null;
                return (
                  <button
                    key={id}
                    onClick={() => askSuggestion(id)}
                    style={{
                      fontSize: 12, padding: '5px 9px', borderRadius: 14, cursor: 'pointer',
                      background: '#fff', color: '#14213D', border: '1px solid #C0392B',
                    }}
                  >
                    {item.q}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={onSend} style={{ display: 'flex', gap: 6, padding: 10, borderTop: '1px solid #eee', background: '#fff' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écris ta question…"
              style={{ flex: 1, padding: '9px 11px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13.5 }}
            />
            <button type="submit" style={{ background: '#C0392B', color: '#fff', border: 'none', borderRadius: 8, padding: '0 14px', cursor: 'pointer', fontWeight: 700 }}>
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
