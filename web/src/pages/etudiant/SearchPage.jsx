import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import ResourceListItem from '../../components/ResourceListItem';

const TYPES = ['pdf', 'docx', 'pptx', 'xlsx', 'image', 'video'];

export default function SearchPage() {
  const navigate = useNavigate();
  const [filieres, setFilieres] = useState([]);
  const [f, setF] = useState('');
  const [n, setN] = useState('');
  const [m, setM] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    client.get('/filieres').then(({ data }) => setFilieres(data.data || []));
  }, []);

  const niveaux = useMemo(() => filieres.find((x) => String(x.id) === f)?.niveaux || [], [filieres, f]);
  const matieres = useMemo(() => niveaux.find((x) => String(x.id) === n)?.matieres || [], [niveaux, n]);

  function runSearch(e) {
    e?.preventDefault();
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (f) params.filiere_id = f;
    if (n) params.niveau_id = n;
    if (m) params.matiere_id = m;
    if (type) params.type_fichier = type;
    client.get('/ressources', { params })
      .then(({ data }) => setResults(data.data || []))
      .finally(() => setLoading(false));
  }

  return (
    <div>
      <div className="page-title">Recherche avancée</div>

      <form className="card" onSubmit={runSearch}>
        <label className="field">Mot-clé</label>
        <input className="input" value={search} onChange={(e) => setSearch(e.target.value)}
               placeholder="Titre ou description…" />

        <div className="row mt" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label className="field">Filière</label>
            <select className="input" value={f} onChange={(e) => { setF(e.target.value); setN(''); setM(''); }}>
              <option value="">Toutes</option>
              {filieres.map((x) => <option key={x.id} value={x.id}>{x.code} — {x.nom}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label className="field">Niveau</label>
            <select className="input" value={n} onChange={(e) => { setN(e.target.value); setM(''); }} disabled={!f}>
              <option value="">Tous</option>
              {niveaux.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label className="field">Matière</label>
            <select className="input" value={m} onChange={(e) => setM(e.target.value)} disabled={!n}>
              <option value="">Toutes</option>
              {matieres.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
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
              onOpen={() => navigate(`/etudiant/ressources/${r.id}`)} />
          ))}
      </div>
    </div>
  );
}
