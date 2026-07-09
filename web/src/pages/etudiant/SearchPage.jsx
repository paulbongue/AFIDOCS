import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import ResourceListItem from '../../components/ResourceListItem';

const TYPES = ['pdf', 'docx', 'pptx', 'xlsx', 'image', 'video'];
const semestresForNiveau = (niveau) => {
  const o = Number(niveau?.ordre) || 0;
  return o > 0 ? [2 * o - 1, 2 * o] : [];
};

export default function SearchPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const base = isAdmin ? '/admin' : user?.role === 'delegue' ? '/delegue' : '/etudiant';

  const [filieres, setFilieres] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [f, setF] = useState('');      // filière (admin uniquement)
  const [n, setN] = useState('');      // niveau
  const [m, setM] = useState('');      // matière
  const [type, setType] = useState('');
  const [semestre, setSemestre] = useState('');
  const [annee, setAnnee] = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    client.get('/filieres').then(({ data }) => setFilieres(data.data || [])).catch(() => {});
    client.get('/annees-academiques').then(({ data }) => setAnnees(data.data || [])).catch(() => {});
  }, []);

  // Niveaux proposés : filière choisie (admin) OU la filière de l'utilisateur, jusqu'à son niveau.
  const niveaux = useMemo(() => {
    if (isAdmin) return filieres.find((x) => String(x.id) === f)?.niveaux || [];
    const my = filieres.find((x) => String(x.id) === String(user?.filiere_id));
    const myOrdre = Number((my?.niveaux || []).find((x) => String(x.id) === String(user?.niveau_id))?.ordre) || 0;
    return (my?.niveaux || [])
      .filter((x) => !myOrdre || Number(x.ordre) <= myOrdre)
      .sort((a, b) => (Number(a.ordre) || 0) - (Number(b.ordre) || 0));
  }, [isAdmin, filieres, f, user]);

  const selectedNiveau = niveaux.find((x) => String(x.id) === n);
  const matieres = selectedNiveau?.matieres || [];
  const semestres = semestresForNiveau(selectedNiveau);

  function runSearch(e) {
    e?.preventDefault();
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (isAdmin && f) params.filiere_id = f;     // le serveur restreint déjà les non-admins
    if (n) params.niveau_id = n;
    if (m) params.matiere_id = m;
    if (semestre) params.semestre = semestre;
    if (annee) params.annee_academique_id = annee;
    if (type) params.type_fichier = type;
    client.get('/ressources', { params })
      .then(({ data }) => setResults(data.data || []))
      .finally(() => setLoading(false));
  }

  return (
    <div>
      <div className="page-title">Recherche avancée</div>
      {!isAdmin && user?.filiere && (
        <p className="muted" style={{ marginTop: 0 }}>
          Recherche dans votre filière {user.filiere.code}{user.niveau ? ` (jusqu'au niveau ${user.niveau.nom})` : ''}.
        </p>
      )}

      <form className="card" onSubmit={runSearch}>
        <label className="field">Mot-clé</label>
        <input className="input" value={search} onChange={(e) => setSearch(e.target.value)}
               placeholder="Titre ou description…" />

        <div className="row mt" style={{ gap: 12, flexWrap: 'wrap' }}>
          {isAdmin && (
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="field">Filière</label>
              <select className="input" value={f} onChange={(e) => { setF(e.target.value); setN(''); setM(''); setSemestre(''); }}>
                <option value="">Toutes</option>
                {filieres.map((x) => <option key={x.id} value={x.id}>{x.code} — {x.nom}</option>)}
              </select>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 140 }}>
            <label className="field">Niveau</label>
            <select className="input" value={n} onChange={(e) => { setN(e.target.value); setM(''); setSemestre(''); }}
                    disabled={isAdmin && !f}>
              <option value="">Tous</option>
              {niveaux.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label className="field">Semestre</label>
            <select className="input" value={semestre} onChange={(e) => setSemestre(e.target.value)} disabled={semestres.length === 0}>
              <option value="">Tous</option>
              {semestres.map((s) => <option key={s} value={s}>S{s}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label className="field">Matière</label>
            <select className="input" value={m} onChange={(e) => setM(e.target.value)} disabled={!n}>
              <option value="">Toutes</option>
              {matieres.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label className="field">Année académique</label>
            <select className="input" value={annee} onChange={(e) => setAnnee(e.target.value)}>
              <option value="">Toutes</option>
              {annees.map((a) => <option key={a.id} value={a.id}>{a.libelle}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label className="field">Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Tous</option>
              {TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        <button className="btn btn-red mt">Rechercher</button>
      </form>

      <div className="mt">
        {loading ? <div className="empty">Recherche…</div>
          : results.length === 0 ? <div className="empty">Lancez une recherche pour voir les résultats.</div>
          : results.map((r) => (
            <ResourceListItem key={r.id} ressource={r}
              onOpen={() => navigate(`${base}/ressources/${r.id}`)} />
          ))}
      </div>
    </div>
  );
}
