import React, { useCallback, useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { initials, labelForType, formatSize } from '../theme';
import { IconPin } from '../components/Icons';

// Espace de discussion de la classe de l'utilisateur (son niveau).
export default function ClassDiscussionPage() {
  const { user } = useAuth();
  const niveauId = user?.niveau_id;

  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const [schedTitre, setSchedTitre] = useState('');
  const [schedFile, setSchedFile] = useState(null);
  const [schedBusy, setSchedBusy] = useState(false);

  const load = useCallback(async () => {
    if (!niveauId) return;
    setErr(null);
    try {
      const { data } = await client.get(`/classes/${niveauId}/discussion`);
      setData(data);
    } catch (e) {
      setErr(e?.response?.status === 403
        ? "Cet espace est réservé aux membres de la classe."
        : "Impossible de charger la discussion. Vérifiez votre connexion.");
    }
  }, [niveauId]);

  useEffect(() => { load(); }, [load]);

  if (!niveauId) {
    return <div className="empty">Aucune classe ne vous est associée. Contactez l'administration.</div>;
  }
  if (err) {
    return (
      <div className="empty">
        {err}
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-red" onClick={load}>Réessayer</button>
        </div>
      </div>
    );
  }
  if (!data) return <div className="empty">Chargement…</div>;

  const { schedule, messages, is_moderator, classe, ttl_days } = data;

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await client.post(`/classes/${niveauId}/messages`, { contenu: text.trim() });
      setText('');
      await load();
    } finally { setBusy(false); }
  }

  async function removeMessage(id) {
    if (!confirm('Supprimer ce message ?')) return;
    await client.delete(`/class-messages/${id}`);
    await load();
  }

  async function saveSchedule(e) {
    e.preventDefault();
    if (!schedFile && !schedTitre.trim()) return;
    setSchedBusy(true);
    try {
      const fd = new FormData();
      if (schedTitre.trim()) fd.append('titre', schedTitre.trim());
      if (schedFile) fd.append('fichier', schedFile);
      await client.post(`/classes/${niveauId}/schedule`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSchedFile(null); setSchedTitre('');
      await load();
    } finally { setSchedBusy(false); }
  }

  async function removeSchedule() {
    if (!confirm("Supprimer l'emploi du temps ?")) return;
    await client.delete(`/classes/${niveauId}/schedule`);
    await load();
  }

  return (
    <div className="disc-wrap">
      <div className="page-title">Ma classe — {classe?.filiere?.code} · {classe?.niveau}</div>

      {/* Emploi du temps du semestre — épinglé (reste visible au défilement) */}
      <div className="pinned">
        <div className="pinned-head"><IconPin size={16} /><b>{schedule?.titre || 'Emploi du temps du semestre'}</b></div>
        {schedule ? (
          <div className="pinned-body">
            {schedule.description && <p className="muted" style={{ margin: '4px 0' }}>{schedule.description}</p>}
            {schedule.url_fichier && (
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <a className="btn btn-red" href={schedule.url_fichier} target="_blank" rel="noreferrer">📅 Ouvrir l'emploi du temps</a>
                <span className="muted">{labelForType(schedule.type_fichier)} · {formatSize(schedule.taille_fichier)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="muted">Aucun emploi du temps publié pour le moment.</div>
        )}

        {is_moderator && (
          <form className="pinned-edit" onSubmit={saveSchedule}>
            <input className="input" placeholder="Titre (optionnel)" value={schedTitre} onChange={(e) => setSchedTitre(e.target.value)} />
            <input className="input" type="file" onChange={(e) => setSchedFile(e.target.files?.[0] || null)} />
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-navy" disabled={schedBusy}>{schedBusy ? '…' : (schedule ? 'Mettre à jour' : 'Publier')}</button>
              {schedule && <button type="button" className="btn btn-ghost" onClick={removeSchedule}>Supprimer</button>}
            </div>
          </form>
        )}
      </div>

      <div className="muted" style={{ margin: '14px 0 8px' }}>
        💬 Discussion entre étudiants de la classe. Les messages disparaissent après {ttl_days} jours.
      </div>

      <div className="chat">
        {messages.length === 0 && <div className="empty">Aucun message. Lancez la discussion !</div>}
        {messages.map((m) => {
          const mine = m.user_id === user.id;
          const canDel = mine || is_moderator;
          return (
            <div key={m.id} className={'chat-msg' + (mine ? ' mine' : '')}>
              <span className="avatar">{initials(m.auteur?.name)}</span>
              <div className="chat-bubble">
                <div className="chat-meta">
                  <b>{m.auteur?.name}</b>
                  {m.auteur?.role === 'delegue' && <span className="role-chip">délégué</span>}
                </div>
                <div>{m.contenu}</div>
                {canDel && <button className="chat-del" onClick={() => removeMessage(m.id)}>Supprimer</button>}
              </div>
            </div>
          );
        })}
      </div>

      <form className="row mt" onSubmit={send} style={{ gap: 8 }}>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrire un message…" />
        <button className="btn btn-red" disabled={busy}>Envoyer</button>
      </form>
    </div>
  );
}
