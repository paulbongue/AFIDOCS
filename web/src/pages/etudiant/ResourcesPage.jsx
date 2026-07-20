import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import ResourceListItem from '../../components/ResourceListItem';
import ResourceCard from '../../components/ResourceCard';
import ViewToggle, { useViewMode } from '../../components/ViewToggle';
import { SkeletonRows } from '../../components/Loader';
import { IconSearch } from '../../components/Icons';

// Les 2 semestres (globaux) d'un niveau d'ordre n : S(2n-1) et S(2n).
const semestresForNiveau = (niveau) => {
  const o = Number(niveau?.ordre) || 0;
  return o > 0 ? [2 * o - 1, 2 * o] : [];
};

export default function ResourcesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [view, setView] = useViewMode();

  const isAdmin = user?.role === 'admin';
  const base = isAdmin ? '/admin' : user?.role === 'delegue' ? '/delegue' : '/etudiant';

  const [ressources, setRessources] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [active, setActive] = useState(null);          // admin uniquement : filière explorée
  const [activeNiveau, setActiveNiveau] = useState(null);
  const [activeSemestre, setActiveSemestre] = useState(null);
  const [activeAnnee, setActiveAnnee] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    client.get('/filieres').then(({ data }) => setFilieres(data.data || [])).catch(() => {});
    client.get('/annees-academiques').then(({ data }) => setAnnees(data.data || [])).catch(() => {});
  }, []);

  // Requête : le serveur restreint déjà l'accès (filière + niveau et en-dessous)
  // pour les étudiants et délégués. Les filtres ne font qu'affiner.
  useEffect(() => {
    setLoading(true);
    const params = {};
    if (isAdmin && active) params.filiere_id = active;
    if (activeNiveau) params.niveau_id = activeNiveau;
    if (activeSemestre) params.semestre = activeSemestre;
    if (activeAnnee) params.annee_academique_id = activeAnnee;
    if (search) params.search = search;
    const t = setTimeout(() => {
      client.get('/ressources', { params })
        .then(({ data }) => setRessources(data.data || []))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [isAdmin, active, activeNiveau, activeSemestre, activeAnnee, search]);

  // Niveaux proposés à l'utilisateur non-admin : ceux de SA filière, jusqu'à SON niveau.
  const myNiveaux = useMemo(() => {
    if (isAdmin) return [];
    const myFiliere = filieres.find((f) => String(f.id) === String(user?.filiere_id));
    const myNiveauObj = (myFiliere?.niveaux || []).find((n) => String(n.id) === String(user?.niveau_id));
    const myOrdre = Number(myNiveauObj?.ordre) || 0;
    return (myFiliere?.niveaux || [])
      .filter((n) => !myOrdre || Number(n.ordre) <= myOrdre)
      .sort((a, b) => (Number(a.ordre) || 0) - (Number(b.ordre) || 0));
  }, [filieres, isAdmin, user]);

  const selectedNiveau = useMemo(() => {
    const source = isAdmin
      ? (filieres.find((f) => String(f.id) === String(active))?.niveaux || [])
      : myNiveaux;
    return source.find((n) => String(n.id) === String(activeNiveau));
  }, [isAdmin, filieres, active, myNiveaux, activeNiveau]);

  const semestres = semestresForNiveau(selectedNiveau);

  const renderList = (items) => (
    view === 'grid' ? (
      <div className="res-grid">
        {items.map((r) => (
          <ResourceCard key={r.id} ressource={r} onOpen={() => navigate(`${base}/ressources/${r.id}`)} />
        ))}
      </div>
    ) : items.map((r) => (
      <ResourceListItem key={r.id} ressource={r} onOpen={() => navigate(`${base}/ressources/${r.id}`)} />
    ))
  );

  return (
    <div>
      <div className="spread" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>Ressources</div>
        <ViewToggle value={view} onChange={setView} />
      </div>
      {user?.filiere && !isAdmin && (
        <div className="muted" style={{ marginTop: 6 }}>
          {user.filiere.code}{user.niveau ? ` · ${user.niveau.nom}` : ''} — {user.filiere.nom}
          <span> · vous accédez aux ressources de votre filière, de votre niveau et des niveaux inférieurs.</span>
        </div>
      )}

      <div className="card mt">
        <div className="search-premium">
          <IconSearch size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
                 placeholder="Rechercher une ressource, un auteur, une matière…" />
        </div>

        {/* Filtre année académique (liste déroulante) */}
        {annees.length > 0 && (
          <div className="row mt" style={{ flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span className="muted">Année :</span>
            <select className="input" style={{ maxWidth: 220 }}
                    value={activeAnnee || ''}
                    onChange={(e) => setActiveAnnee(e.target.value || null)}>
              <option value="">Toutes</option>
              {annees.map((a) => <option key={a.id} value={a.id}>{a.libelle}</option>)}
            </select>
          </div>
        )}

        {/* Admin : sélection de la filière à explorer (liste déroulante) */}
        {isAdmin && (
          <div className="row mt" style={{ flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span className="muted">Filière :</span>
            <select className="input" style={{ maxWidth: 340 }}
                    value={active || ''}
                    onChange={(e) => { setActive(e.target.value || null); setActiveNiveau(null); setActiveSemestre(null); }}>
              <option value="">Toutes les filières</option>
              {filieres.map((f) => <option key={f.id} value={f.id}>{f.code} — {f.nom}</option>)}
            </select>
          </div>
        )}

        {/* Filtre niveau : filière sélectionnée (admin) ou niveaux autorisés (autres) */}
        {(() => {
          const niveaux = isAdmin
            ? (filieres.find((f) => String(f.id) === String(active))?.niveaux || [])
            : myNiveaux;
          if (niveaux.length === 0) return null;
          return (
            <div className="row mt" style={{ flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span className="muted">Niveau :</span>
              <select className="input" style={{ maxWidth: 220 }}
                      value={activeNiveau || ''}
                      onChange={(e) => { setActiveNiveau(e.target.value || null); setActiveSemestre(null); }}>
                <option value="">Tous</option>
                {niveaux.map((n) => <option key={n.id} value={n.id}>{n.nom}</option>)}
              </select>
            </div>
          );
        })()}

        {/* Filtre semestre : uniquement quand un niveau est sélectionné (liste déroulante) */}
        {semestres.length > 0 && (
          <div className="row mt" style={{ flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span className="muted">Semestre :</span>
            <select className="input" style={{ maxWidth: 160 }}
                    value={activeSemestre || ''}
                    onChange={(e) => setActiveSemestre(e.target.value || null)}>
              <option value="">Tous</option>
              {semestres.map((s) => <option key={s} value={s}>S{s}</option>)}
            </select>
          </div>
        )}

        <div className="mt">
          {loading ? <SkeletonRows count={5} />
            : ressources.length === 0 ? <div className="empty">Aucune ressource trouvée.</div>
            : renderList(ressources)}
        </div>
      </div>
    </div>
  );
}
