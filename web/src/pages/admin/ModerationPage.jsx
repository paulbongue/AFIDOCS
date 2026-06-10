import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import Badge from '../../components/Badge';
import { labelForType, formatSize } from '../../theme';

// Modération a posteriori : suppression de toute ressource (et accès au détail
// pour modérer les commentaires).
export default function ModerationPage() {
  const navigate = useNavigate();
  const [ressources, setRessources] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await client.get('/ressources', { params: search ? { search } : {} });
    setRessources(data.data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function remove(id) {
    if (!confirm('Supprimer définitivement cette ressource ?')) return;
    await client.delete(`/admin/ressources/${id}`);
    await load();
  }

  return (
    <div>
      <div className="page-title">Modération</div>
      <p className="muted">Supervisez et retirez tout contenu inapproprié (ressources et commentaires).</p>

      <input className="input" style={{ maxWidth: 420 }} value={search}
             onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une ressource…" />

      <table className="tbl mt">
        <thead>
          <tr><th>Titre</th><th>Filière</th><th>Type</th><th>Taille</th><th>Auteur</th><th>💬</th><th></th></tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} className="muted" style={{ textAlign: 'center' }}>Chargement…</td></tr>
          ) : ressources.length === 0 ? (
            <tr><td colSpan={7} className="muted" style={{ textAlign: 'center' }}>Aucune ressource.</td></tr>
          ) : ressources.map((r) => {
            const f = r.matiere?.niveau?.filiere;
            return (
              <tr key={r.id}>
                <td style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/ressources/${r.id}`)}><b>{r.titre}</b></td>
                <td>{f ? <Badge code={f.code} couleur={f.couleur} /> : '—'}</td>
                <td>{labelForType(r.type_fichier)}</td>
                <td>{formatSize(r.taille_fichier)}</td>
                <td>{r.auteur?.name}</td>
                <td>{r.commentaires_count ?? 0}</td>
                <td><button className="btn btn-danger" onClick={() => remove(r.id)}>Supprimer</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
