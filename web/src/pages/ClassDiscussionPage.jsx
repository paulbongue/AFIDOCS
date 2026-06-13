import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { initials } from '../theme';
import { IconPin, IconUsers } from '../components/Icons';
import SchedulePreview from '../components/SchedulePreview';

// Espace de discussion de la classe de l'utilisateur (son niveau).
export default function ClassDiscussionPage() {
  const { user } = useAuth();
  const niveauId = user?.niveau_id;
  const [searchParams] = useSearchParams();
  const focusMsg = searchParams.get('msg');
  const [highlight, setHighlight] = useState(null);
  const [showMembers, setShowMembers] = useState(false);

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

  // Notification ciblée : défile jusqu'au message et le met en surbrillance.
  useEffect(() => {
    if (!data || !focusMsg) return;
    const el = document.getElementById(`msg-${focusMsg}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlight(String(focusMsg));
    const t = setTimeout(() => setHighlight(null), 2600);
    return () => clearTimeout(t);
  }, [data, focusMsg]);

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

  const { schedule, messages, is_moderator, classe, ttl_days, members = [], members_count = 0 } = data;

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
      <div className="spread" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>Ma classe — {classe?.filiere?.code} · {classe?.niveau}</div>
        <button className="btn btn-ghost" onClick={() => setShowMembers((s) => !s)}>
          <IconUsers size={16} /> {members_count} membre{members_count > 1 ? 's' : ''}
        </button>
      </div>

      {showMembers && (
        <div className="card mt members-card">
          <div className="spread" style={{ marginBottom: 8 }}>
            <b>Membres de la classe ({members_count})</b>
            <span className="muted" style={{ fontSize: 12 }}>Vérifiez qu'aucun compte inconnu n'a été ajouté.</span>
          </div>
          {members.map((mb) => (
            <div key={mb.id} className="member-row">
              <span className="avatar sm">{initials(mb.name)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{mb.name}</b>
                {mb.role === 'delegue' && <span className="role-chip">délégué</span>}
                {mb.id === user.id && <span className="role-chip">vous</span>}
              </div>
              {mb.created_at && (
                <span className="muted" style={{ fontSize: 12 }}>
                  ajouté le {new Date(mb.created_at).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          ))}
          {members.length === 0 && <div className="muted">Aucun membre listé.</div>}
        </div>
      )}

      {/* Emploi du temps — épinglé (reste visible au défilement) */}
      <div className="pinned">
        <div className="pinned-head"><IconPin size={16} /><b>{schedule?.titre || 'Emploi du temps'}</b></div>
        {schedule ? (
          <div className="pinned-body">
            {schedule.description && <p className="muted" style={{ margin: '4px 0' }}>{schedule.description}</p>}
            <SchedulePreview schedule={schedule} />
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
            <div key={m.id} id={`msg-${m.id}`}
                 className={'chat-msg' + (mine ? ' mine' : '') + (highlight === String(m.id) ? ' flash' : '')}>
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
