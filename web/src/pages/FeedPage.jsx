import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { initials, colorForFiliere } from '../theme';
import { IconPin } from '../components/Icons';
import SchedulePreview from '../components/SchedulePreview';

// Espace commun (interfilière) : annonces des admins/délégués + commentaires.
export default function FeedPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const focusPost = searchParams.get('post');
  const [highlight, setHighlight] = useState(null);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [filieres, setFilieres] = useState([]);

  // Composer de publication
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [targets, setTargets] = useState([]);   // ids de filières ciblées
  const [niveauId, setNiveauId] = useState('');
  const [posting, setPosting] = useState(false);
  const [postErr, setPostErr] = useState(null);

  // Emploi du temps (admin)
  const [schedTitre, setSchedTitre] = useState('');
  const [schedFile, setSchedFile] = useState(null);
  const [schedBusy, setSchedBusy] = useState(false);

  // Saisie des commentaires (par publication)
  const [commentText, setCommentText] = useState({});

  const load = useCallback(async () => {
    setErr(null);
    try {
      const { data } = await client.get('/feed');
      setData(data);
    } catch (e) {
      setErr("Impossible de charger les annonces. Vérifiez votre connexion.");
    }
  }, []);

  useEffect(() => {
    load();
    client.get('/filieres').then(({ data }) => setFilieres(data.data || [])).catch(() => {});
  }, [load]);

  // Notification ciblée : défile jusqu'à la publication et la met en surbrillance.
  useEffect(() => {
    if (!data || !focusPost) return;
    const el = document.getElementById(`post-${focusPost}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlight(String(focusPost));
    const t = setTimeout(() => setHighlight(null), 2600);
    return () => clearTimeout(t);
  }, [data, focusPost]);

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
  const { posts, schedule, can_post, is_admin, ttl_days } = data;

  function pickImage(e) {
    const f = e.target.files?.[0] || null;
    setImage(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function toggleTarget(id) {
    setTargets((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
    setNiveauId('');
  }

  const singleFiliere = targets.length === 1 ? filieres.find((f) => f.id === targets[0]) : null;

  async function submitPost(e) {
    e.preventDefault();
    if (!text.trim() && !image) return;
    setPosting(true);
    setPostErr(null);
    try {
      const fd = new FormData();
      if (text.trim()) fd.append('contenu', text.trim());
      if (image) fd.append('image', image);
      targets.forEach((id) => fd.append('target_filiere_ids[]', id));
      if (niveauId) fd.append('target_niveau_id', niveauId);
      await client.post('/feed/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setText(''); setImage(null); setPreview(null); setTargets([]); setNiveauId('');
      await load();
    } catch (e2) {
      const st = e2?.response?.status;
      setPostErr(
        st === 413 ? 'Photo trop volumineuse pour le serveur.'
          : e2?.response?.data?.message
          || e2?.response?.data?.errors?.contenu?.[0]
          || e2?.response?.data?.errors?.image?.[0]
          || `Publication impossible${st ? ` (erreur ${st})` : ''}.`
      );
    } finally { setPosting(false); }
  }

  async function removePost(id) {
    if (!confirm('Supprimer cette publication ?')) return;
    await client.delete(`/feed/posts/${id}`);
    await load();
  }

  async function sendComment(postId) {
    const c = (commentText[postId] || '').trim();
    if (!c) return;
    await client.post(`/feed/posts/${postId}/comments`, { contenu: c });
    setCommentText((s) => ({ ...s, [postId]: '' }));
    await load();
  }

  async function removeComment(id) {
    if (!confirm('Supprimer ce commentaire ?')) return;
    await client.delete(`/feed/comments/${id}`);
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
      await client.post('/feed/schedule', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSchedTitre(''); setSchedFile(null);
      await load();
    } finally { setSchedBusy(false); }
  }

  async function removeSchedule() {
    if (!confirm("Supprimer l'emploi du temps ?")) return;
    await client.delete('/feed/schedule');
    await load();
  }

  return (
    <div className="disc-wrap">
      <div className="page-title">Annonces</div>

      {/* Emploi du temps général — épinglé */}
      <div className="pinned">
        <div className="pinned-head"><IconPin size={16} /><b>{schedule?.titre || 'Emploi du temps général'}</b></div>
        {schedule ? (
          <div className="pinned-body">
            {schedule.description && <p className="muted" style={{ margin: '4px 0' }}>{schedule.description}</p>}
            <SchedulePreview schedule={schedule} />
          </div>
        ) : (
          <div className="muted">Aucun emploi du temps publié.</div>
        )}

        {is_admin && (
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

      {/* Composer (admin + délégué uniquement) */}
      {can_post && (
        <form className="card mt post-composer" onSubmit={submitPost}>
          <textarea className="input" rows={3} placeholder="Partager une information…" value={text} onChange={(e) => setText(e.target.value)} />
          {preview && (
            <div className="post-img-prev">
              <img src={preview} alt="aperçu" />
              <button type="button" className="btn btn-ghost" onClick={() => { setImage(null); setPreview(null); }}>Retirer la photo</button>
            </div>
          )}
          <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>Cibler des filières (optionnel) :</div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {filieres.map((f) => {
              const c = f.couleur || colorForFiliere(f.code);
              const on = targets.includes(f.id);
              return (
                <button type="button" key={f.id} className="tgt-chip" onClick={() => toggleTarget(f.id)}
                        style={{ background: on ? c : 'transparent', color: on ? '#fff' : c, borderColor: c }}>
                  {f.code}
                </button>
              );
            })}
          </div>
          {singleFiliere?.niveaux?.length > 0 && (
            <select className="input mt" value={niveauId} onChange={(e) => setNiveauId(e.target.value)} style={{ maxWidth: 280 }}>
              <option value="">Tous les niveaux de {singleFiliere.code}</option>
              {singleFiliere.niveaux.map((n) => <option key={n.id} value={n.id}>{n.nom}</option>)}
            </select>
          )}
          <div className="row mt" style={{ gap: 8, alignItems: 'center' }}>
            <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
              📷 Photo<input type="file" accept="image/*" hidden onChange={pickImage} />
            </label>
            <button className="btn btn-red" disabled={posting}>{posting ? 'Publication…' : 'Publier'}</button>
          </div>
          {postErr && <div style={{ color: 'var(--red)', marginTop: 10 }}>{postErr}</div>}
        </form>
      )}

      <div className="muted" style={{ margin: '14px 0 8px' }}>Les publications disparaissent après {ttl_days} jours.</div>

      {posts.length === 0 && <div className="empty">Aucune publication pour le moment.</div>}
      {posts.map((p) => (
        <div key={p.id} id={`post-${p.id}`}
             className={'card post mt' + (highlight === String(p.id) ? ' flash' : '')}>
          <div className="spread">
            <div className="row">
              <span className="avatar">{initials(p.auteur?.name)}</span>
              <div>
                <b>{p.auteur?.name}</b> {p.auteur?.role && <span className="role-chip">{p.auteur.role}</span>}
                <div className="muted" style={{ fontSize: 12 }}>{new Date(p.created_at).toLocaleString('fr-FR')}</div>
              </div>
            </div>
            {(is_admin || p.user_id === user.id) && (
              <button className="btn btn-ghost" onClick={() => removePost(p.id)}>Supprimer</button>
            )}
          </div>

          {(p.filieres?.length > 0 || p.target_niveau) && (
            <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {p.filieres.map((f) => (
                <span key={f.id} className="tgt-chip on" style={{ background: f.couleur || colorForFiliere(f.code) }}>{f.code}</span>
              ))}
              {p.target_niveau && <span className="tgt-chip on" style={{ background: 'var(--navy)' }}>{p.target_niveau.nom}</span>}
            </div>
          )}

          {p.contenu && <p style={{ marginTop: 10, whiteSpace: 'pre-wrap' }}>{p.contenu}</p>}
          {p.image_url && <div className="post-img"><img src={p.image_url} alt="publication" /></div>}

          <div className="post-comments">
            {(p.commentaires || []).map((c) => (
              <div key={c.id} className="post-comment">
                <span className="avatar sm">{initials(c.auteur?.name)}</span>
                <div className="pc-body"><b>{c.auteur?.name}</b> <span>{c.contenu}</span></div>
                {(is_admin || c.user_id === user.id) && <button className="pc-del" title="Supprimer" onClick={() => removeComment(c.id)}>×</button>}
              </div>
            ))}
            <div className="row mt" style={{ gap: 8 }}>
              <input className="input" placeholder="Commenter…" value={commentText[p.id] || ''}
                     onChange={(e) => setCommentText((s) => ({ ...s, [p.id]: e.target.value }))}
                     onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendComment(p.id); } }} />
              <button className="btn btn-ghost" onClick={() => sendComment(p.id)}>Envoyer</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
