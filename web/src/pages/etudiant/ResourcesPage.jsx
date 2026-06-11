import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import ResourceListItem from '../../components/ResourceListItem';
import { colorForFiliere } from '../../theme';

export default function ResourcesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const base = user?.role === 'admin' ? '/admin' : user?.role === 'delegue' ? '/delegue' : '/etudiant';

  const [recos, setRecos] = useState([]);
  const [recoLoading, setRecoLoading] = useState(true);
  const [browse, setBrowse] = useState(false);

  // état du mode "explorer" (toutes filières)
  const [ressources, setRessources] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [active, setActive] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    client.get('/filieres').then(({ data }) => setFilieres(data.data || []));
  }, []);

  // Ressources recommandées : filière + niveau de l'utilisateur connecté.
  useEffect(() => {
    if (!user?.filiere_id) { setRecos([]); setRecoLoading(false); return; }
    const params = { filiere_id: user.filiere_id };
    if (user.niveau_id) params.niveau_id = user.niveau_id;
    setRecoLoading(true);
    client.get('/ressources', { params })
      .then(({ data }) => setRecos(data.data || []))
      .finally(() => setRecoLoading(false));
  }, [user]);

  const hasClass = !!user?.filiere_id; // false pour l'admin -> liste complète

  // Exploration des autres filières/niveaux (browse, ou admin sans classe).
  useEffect(() => {
    if (!browse && hasClass) return;
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
  }, [browse, active, search]);

  return (
    <div>
      <div className="spread" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>
          {hasClass ? 'Recommandées pour votre classe' : 'Ressources'}
        </div>
        {hasClass && (
          <button className={'btn ' + (browse ? 'btn-ghost' : 'btn-red')} onClick={() => setBrowse((b) => !b)}>
            {browse ? '← Revenir à ma classe' : '🔎 Rechercher d’autres ressources'}
          </button>
        )}
      </div>
      {user?.filiere && (
        <div className="muted" style={{ marginTop: 6 }}>
          {user.filiere.code}{user.niveau ? ` · ${user.niveau.nom}` : ''} — {user.filiere.nom}
        </div>
      )}

      {/* Section recommandée (uniquement si l'utilisateur a une classe) */}
      {hasClass && (
        <div className="mt">
          {recoLoading ? <div className="empty">Chargement…</div>
            : recos.length === 0 ? (
              <div className="empty">
                Aucune ressource pour votre classe pour l’instant.<br />
                Cliquez sur « Rechercher d’autres ressources » pour explorer les autres filières.
              </div>
            ) : recos.map((r) => (
              <ResourceListItem key={r.id} ressource={r} onOpen={() => navigate(`${base}/ressources/${r.id}`)} />
            ))}
        </div>
      )}

      {/* Section exploration (toutes filières) */}
      {(browse || !hasClass) && (
        <div className="card mt">
          <h3>Explorer toutes les ressources</h3>
          <input className="input mt" style={{ maxWidth: 420 }} value={search}
                 onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une ressource…" />

          <div className="row mt" style={{ flexWrap: 'wrap', gap: 8 }}>
            <button className={'btn ' + (!active ? 'btn-red' : 'btn-ghost')} onClick={() => setActive(null)}>Toutes</button>
            {filieres.map((f) => (
              <button key={f.id}
                className={'btn ' + (active === f.id ? 'btn-red' : 'btn-ghost')}
                style={active === f.id ? { background: f.couleur || colorForFiliere(f.code), border: 'none', color: '#fff' } : {}}
                onClick={() => setActive(f.id)}>
                {f.code}
              </button>
            ))}
          </div>

          {active && (
            <h3 className="mt" style={{ fontSize: 15 }}>
              {filieres.find((f) => String(f.id) === String(active))?.nom}
            </h3>
          )}

          <div className="mt">
            {loading ? <div className="empty">Chargement…</div>
              : ressources.length === 0 ? <div className="empty">Aucune ressource trouvée.</div>
              : ressources.map((r) => (
                <ResourceListItem key={r.id} ressource={r} onOpen={() => navigate(`${base}/ressources/${r.id}`)} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
