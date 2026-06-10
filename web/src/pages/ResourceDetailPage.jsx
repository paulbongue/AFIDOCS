import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';
import { labelForType, formatSize, colorForFiliere, initials } from '../theme';

export default function ResourceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [res, setRes] = useState(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await client.get(`/ressources/${id}`);
    setRes(data.data);
  }, [id]);

  useEffect(() => { load(); }, [load]);

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

  if (!res) return <div className="empty">Chargement…</div>;

  const f = res.matiere?.niveau?.filiere;
  const niveau = res.matiere?.niveau;
  const accent = f?.couleur || colorForFiliere(f?.code);
  const canDelete = user?.role === 'admin' || (user?.role === 'delegue' && res.user_id === user?.id);

  return (
    <div>
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
          <a className="btn btn-ghost" href={res.url_fichier} target="_blank" rel="noreferrer">👁 Aperçu</a>
          <a className="btn btn-red" href={res.url_fichier} download>⬇ Télécharger</a>
          {canDelete && (
            <button className="btn btn-danger" onClick={async () => {
              if (!confirm('Supprimer cette ressource ?')) return;
              await client.delete(`${user.role === 'admin' ? '/admin' : ''}/ressources/${id}`);
              navigate(-1);
            }}>Supprimer</button>
          )}
        </div>
      </div>

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
