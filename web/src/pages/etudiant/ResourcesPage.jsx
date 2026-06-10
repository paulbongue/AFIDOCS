import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import ResourceListItem from '../../components/ResourceListItem';
import { colorForFiliere } from '../../theme';

export default function ResourcesPage() {
  const navigate = useNavigate();
  const [ressources, setRessources] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [active, setActive] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/filieres').then(({ data }) => setFilieres(data.data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (active) params.filiere_id = active;
    if (search) params.search = search;
    const t = setTimeout(() => {
      client.get('/ressources', { params })
        .then(({ data }) => setRessources(data.data || []))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [active, search]);

  return (
    <div>
      <div className="page-title">Ressources — toutes filières</div>

      <input className="input" style={{ maxWidth: 420 }} value={search}
             onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une ressource…" />

      <div className="row mt" style={{ flexWrap: 'wrap', gap: 8 }}>
        <button className={'btn ' + (!active ? 'btn-red' : 'btn-ghost')} onClick={() => setActive(null)}>Toutes</button>
        {filieres.map((f) => (
          <button key={f.id}
            className={'btn ' + (active === f.id ? 'btn-red' : 'btn-ghost')}
            style={active === f.id ? { background: f.couleur || colorForFiliere(f.code), border: 'none' } : {}}
            onClick={() => setActive(f.id)}>
            {f.code}
          </button>
        ))}
      </div>

      {active && (
        <h3 className="mt" style={{ marginTop: 18 }}>
          {filieres.find((f) => String(f.id) === String(active))?.nom}
        </h3>
      )}

      <div className="mt">
        {loading ? <div className="empty">Chargement…</div>
          : ressources.length === 0 ? <div className="empty">Aucune ressource trouvée.</div>
          : ressources.map((r) => (
            <ResourceListItem key={r.id} ressource={r}
              onOpen={() => navigate(`/etudiant/ressources/${r.id}`)} />
          ))}
      </div>
    </div>
  );
}
