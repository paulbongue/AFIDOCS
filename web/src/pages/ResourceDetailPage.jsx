import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client, { recordActivity } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';
import { labelForType, formatSize, colorForFiliere, initials } from '../theme';

export default function ResourceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [res, setRes] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Édition de la ressource (titre / description / remplacement de fichier).
  const [editing, setEditing] = useState(false);
  const [eTitre, setETitre] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eFile, setEFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editMsg, setEditMsg] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get(`/ressources/${id}`);
      setRes(data.data);
      setNotFound(false);
    } catch (e) {
      if (e?.response?.status === 404) setNotFound(true);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Trace une consultation (une fois par ressource ouverte) — hors admin.
  useEffect(() => {
    if (user && user.role !== 'admin') recordActivity('view', Number(id));
  }, [id, user]);

  function startEdit() {
    setETitre(res.titre || '');
    setEDesc(res.description || '');
    setEFile(null);
    setEditMsg(null);
    setEditing(true);
  }

  async function saveEdit(e) {
    e.preventDefault();
    setEditMsg(null);
    if (!eTitre.trim()) { setEditMsg({ type: 'err', text: 'Le titre est requis.' }); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('_method', 'PUT'); // method spoofing : envoi multipart
      fd.append('titre', eTitre.trim());
      fd.append('description', eDesc);
      if (eFile) fd.append('fichier', eFile);
      const url = user?.role === 'admin' ? `/admin/ressources/${id}` : `/ressources/${id}`;
      await client.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setEditing(false);
      await load();
    } catch (err) {
      setEditMsg({ type: 'err', text: err?.response?.data?.message || 'Modification impossible.' });
    } finally { setSaving(false); }
  }

  async function sendComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await client.post(`/ressources/${id}/commentaires`, { contenu: comment.trim() });
      setComment('');
      await load();
    } finally { setBusy(false); }
  }

  async function deleteComment(cid) {
    if (!confirm('Supprimer ce commentaire ?')) return;
    await client.delete(`/commentaires/${cid}`);
    await load();
  }

  if (notFound) {
    return (
      <div className="empty">
        Cette ressource a été supprimée.
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-red" onClick={() => navigate(-1)}>← Retour</button>
        </div>
      </div>
    );
  }
  if (!res) return <div className="empty">Chargement…</div>;

  const f = res.matiere?.niveau?.filiere;
  const niveau = res.matiere?.niveau;
  const accent = f?.couleur || colorForFiliere(f?.code);
  const canDelete = user?.role === 'admin' || (user?.role === 'delegue' && res.user_id === user?.id);
  const canEdit = canDelete; // mêmes droits : admin partout, délégué sur les siennes

  const listBase = user?.role === 'delegue' ? '/delegue/ressources'
    : user?.role === 'etudiant' ? '/etudiant/ressources' : null;

  return (
    <div>
      <div className="row" style={{ marginBottom: 14, gap: 10 }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Retour</button>
        {listBase && (
          <button className="btn btn-ghost" onClick={() => navigate(listBase)}>Liste des ressources</button>
        )}
      </div>

      <div className="breadcrumb">
        {f?.code} <span className="sep">›</span> {niveau?.nom} <span className="sep">›</span> {res.matiere?.nom}
      </div>

      <div className="card" style={{ background: 'var(--card-gray)' }}>
        <div className="row">
          <div className="res-icon" style={{ background: accent, width: 52, height: 52 }}>
            {labelForType(res.type_fichier)}
          </div>
          <div style={{ flex: 1 }}>
            <h2>{res.titre}</h2>
            <div className="muted" style={{ marginTop: 4 }}>
              {f?.code} · {niveau?.nom} · {res.matiere?.nom} · {labelForType(res.type_fichier)} · {formatSize(res.taille_fichier)}
            </div>
            <div className="muted" style={{ fontSize: 13 }}>Publié par {res.auteur?.name}</div>
          </div>
          <Badge code={f?.code} couleur={f?.couleur} />
        </div>

        {res.description && <p style={{ marginTop: 14 }}>{res.description}</p>}

        <div className="row mt">
          <button className="btn btn-ghost" onClick={() => setShowPreview((s) => !s)}>
            👁 {showPreview ? "Masquer l'aperçu" : 'Aperçu'}
          </button>
          {user?.role !== 'admin' && (
            <a className="btn btn-red" href={res.url_fichier} download
               onClick={() => recordActivity('download', res.id)}>⬇ Télécharger</a>
          )}
          {canEdit && !editing && (
            <button className="btn btn-ghost" onClick={startEdit}>✏ Modifier</button>
          )}
          {canDelete && (
            <button className="btn btn-danger" onClick={async () => {
              if (!confirm('Supprimer cette ressource ?')) return;
              await client.delete(`${user.role === 'admin' ? '/admin' : ''}/ressources/${id}`);
              navigate(-1);
            }}>Supprimer</button>
          )}
        </div>
      </div>

      {/* Formulaire d'édition (titre / description / remplacement de fichier) */}
      {editing && (
        <form className="card mt" onSubmit={saveEdit}>
          <h3>Modifier la ressource</h3>
          <label className="field">Titre</label>
          <input className="input" value={eTitre} onChange={(e) => setETitre(e.target.value)} />

          <label className="field">Description</label>
          <textarea className="input" rows={3} value={eDesc} onChange={(e) => setEDesc(e.target.value)} />

          <label className="field">Remplacer le fichier (optionnel)</label>
          <input className="input" type="file" onChange={(e) => setEFile(e.target.files?.[0] || null)} />
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Laisse vide pour conserver le fichier actuel.
          </div>

          {editMsg && <div style={{ marginTop: 10, color: 'var(--red)' }}>{editMsg.text}</div>}
          <div className="row mt">
            <button className="btn btn-red" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Annuler</button>
          </div>
        </form>
      )}

      {/* Visionneuse intégrée (sans quitter la plateforme) */}
      {showPreview && (
        res.type_fichier === 'image' ? (
          <div className="card mt" style={{ padding: 0, overflow: 'hidden' }}>
            <img src={res.url_fichier} alt={res.titre} style={{ width: '100%', display: 'block' }} />
          </div>
        ) : res.type_fichier === 'pdf' ? (
          <div className="card mt" style={{ padding: 0, overflow: 'hidden' }}>
            <iframe title="Aperçu du document" src={res.url_fichier}
                    style={{ width: '100%', height: '78vh', border: 'none', display: 'block' }} />
          </div>
        ) : (
          <div className="card mt">
            <div className="muted">
              L'aperçu intégré n'est disponible que pour les PDF et les images. Pour un fichier
              {' '}{labelForType(res.type_fichier)} (Word, PowerPoint, Excel…), télécharge-le pour le consulter.
            </div>
            <a className="btn btn-ghost mt" href={res.url_fichier} target="_blank" rel="noreferrer">Ouvrir dans un nouvel onglet</a>
          </div>
        )
      )}

      <h3 className="mt">Commentaires ({res.commentaires?.length || 0})</h3>

      <form className="row mt" onSubmit={sendComment}>
        <input className="input" value={comment} onChange={(e) => setComment(e.target.value)}
               placeholder="Laisser un commentaire…" />
        <button className="btn btn-red" disabled={busy}>Envoyer</button>
      </form>

      <div className="mt">
        {(res.commentaires || []).map((c) => (
          <div key={c.id} className="card" style={{ marginBottom: 10 }}>
            <div className="spread">
              <div className="row">
                <span className="avatar">{initials(c.auteur?.name)}</span>
                <div>
                  <b>{c.auteur?.name}</b>
                  <div>{c.contenu}</div>
                </div>
              </div>
              {(user?.role === 'admin' || c.user_id === user?.id) && (
                <button className="btn btn-ghost" onClick={() => deleteComment(c.id)}>Supprimer</button>
              )}
            </div>
          </div>
        ))}
        {(!res.commentaires || res.commentaires.length === 0) && (
          <div className="muted">Aucun commentaire pour le moment.</div>
        )}
      </div>
    </div>
  );
}
