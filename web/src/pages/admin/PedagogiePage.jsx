import React, { useCallback, useEffect, useRef, useState } from 'react';
import client from '../../api/client';
import Badge from '../../components/Badge';

// Gestion de la hiérarchie pédagogique : Filière → Niveau → Matière.
export default function PedagogiePage() {
  const [filieres, setFilieres] = useState([]);
  const [selF, setSelF] = useState(null);
  const [selN, setSelN] = useState(null);

  const [newF, setNewF] = useState({ code: '', nom: '', couleur: '#C0392B' });
  const [newN, setNewN] = useState('');
  const [newM, setNewM] = useState('');
  const [newMSem, setNewMSem] = useState('');
  const [newMEns, setNewMEns] = useState('');
  const [annees, setAnnees] = useState([]);
  const [newAnnee, setNewAnnee] = useState('');

  // Semestres possibles d'un niveau (numérotation globale) : ordre n → S(2n-1), S(2n).
  const semestresForNiveau = (niveau) => {
    const o = Number(niveau?.ordre) || 0;
    return o > 0 ? [2 * o - 1, 2 * o] : [];
  };

  const niveauxRef = useRef(null);
  const matieresRef = useRef(null);
  // Sur mobile (colonnes empilées), on défile vers la section suivante au clic.
  const scrollToNext = (ref) => {
    if (window.innerWidth <= 860) {
      setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  };
  const pickFiliere = (f) => { setSelF(f); setSelN(null); scrollToNext(niveauxRef); };
  const pickNiveau = (n) => { setSelN(n); scrollToNext(matieresRef); };

  const load = useCallback(async () => {
    const { data } = await client.get('/filieres');
    const list = data.data || [];
    setFilieres(list);
    // resync sélections
    setSelF((p) => (p ? list.find((f) => f.id === p.id) || null : null));
    try {
      const a = await client.get('/annees-academiques');
      setAnnees(a.data.data || []);
    } catch (_) { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const niveaux = selF?.niveaux || [];
  const matieres = niveaux.find((n) => n.id === selN?.id)?.matieres || [];

  async function addFiliere(e) {
    e.preventDefault();
    if (!newF.code || !newF.nom) return;
    await client.post('/admin/filieres', newF);
    setNewF({ code: '', nom: '', couleur: '#C0392B' });
    await load();
  }
  async function delFiliere(id) {
    if (!confirm('Supprimer la filière et tout son contenu ?')) return;
    await client.delete(`/admin/filieres/${id}`);
    if (selF?.id === id) { setSelF(null); setSelN(null); }
    await load();
  }
  async function addNiveau(e) {
    e.preventDefault();
    if (!newN || !selF) return;
    await client.post('/admin/niveaux', { nom: newN, filiere_id: selF.id });
    setNewN('');
    await load();
  }
  async function delNiveau(id) {
    if (!confirm('Supprimer ce niveau et ses matières ?')) return;
    await client.delete(`/admin/niveaux/${id}`);
    if (selN?.id === id) setSelN(null);
    await load();
  }
  async function addMatiere(e) {
    e.preventDefault();
    if (!newM || !selN) return;
    const sem = newMSem || (semestresForNiveau(selN)[0] ?? null);
    await client.post('/admin/matieres', { nom: newM, niveau_id: selN.id, semestre: sem, enseignant: newMEns.trim() || null });
    setNewM(''); setNewMSem(''); setNewMEns('');
    await load();
  }
  async function setMatiereSem(id, semestre) {
    await client.put(`/admin/matieres/${id}`, { semestre: Number(semestre) });
    await load();
  }
  async function setMatiereEnseignant(id, enseignant) {
    await client.put(`/admin/matieres/${id}`, { enseignant: enseignant || null });
    await load();
  }
  async function delMatiere(id) {
    if (!confirm('Supprimer cette matière ?')) return;
    await client.delete(`/admin/matieres/${id}`);
    await load();
  }

  async function addAnnee(e) {
    e.preventDefault();
    if (!newAnnee.trim()) return;
    await client.post('/admin/annees-academiques', { libelle: newAnnee.trim() });
    setNewAnnee('');
    await load();
  }
  async function setCurrentAnnee(id) {
    await client.post(`/admin/annees-academiques/${id}/courante`);
    await load();
  }
  async function delAnnee(id) {
    if (!confirm('Supprimer cette année académique ?')) return;
    await client.delete(`/admin/annees-academiques/${id}`);
    await load();
  }

  // après reload, resynchroniser selN depuis selF
  useEffect(() => {
    if (selF && selN) {
      const n = (selF.niveaux || []).find((x) => x.id === selN.id);
      setSelN(n || null);
    }
  }, [selF]); // eslint-disable-line

  return (
    <div>
      <div className="page-title">Gestion pédagogique</div>
      <p className="muted">Filière → Niveau → Matière. Sélectionnez un élément pour gérer le niveau inférieur.</p>

      <div className="peda-cols">
        {/* Filières */}
        <div className="card">
          <h3>Filières</h3>
          {filieres.map((f) => (
            <div key={f.id} className={'nav-item' + (selF?.id === f.id ? ' active' : '')}
                 onClick={() => pickFiliere(f)} style={{ justifyContent: 'space-between' }}>
              <span><Badge code={f.code} couleur={f.couleur} /> {f.nom}</span>
              <span onClick={(e) => { e.stopPropagation(); delFiliere(f.id); }} style={{ color: 'var(--red)' }}>✕</span>
            </div>
          ))}
          <form className="mt" onSubmit={addFiliere}>
            <input className="input" placeholder="Code (ex : GL)" value={newF.code}
                   onChange={(e) => setNewF({ ...newF, code: e.target.value.toUpperCase() })} />
            <input className="input mt" placeholder="Nom" value={newF.nom}
                   onChange={(e) => setNewF({ ...newF, nom: e.target.value })} />
            <div className="row mt">
              <input type="color" value={newF.couleur} onChange={(e) => setNewF({ ...newF, couleur: e.target.value })} />
              <button className="btn btn-red" style={{ flex: 1 }}>Ajouter la filière</button>
            </div>
          </form>
        </div>

        {/* Niveaux */}
        <div className="card" ref={niveauxRef} style={{ scrollMarginTop: 80 }}>
          <h3>Niveaux {selF ? `· ${selF.code}` : ''}</h3>
          {!selF ? <div className="muted">Sélectionnez une filière.</div> : (
            <>
              {niveaux.map((n) => (
                <div key={n.id} className={'nav-item' + (selN?.id === n.id ? ' active' : '')}
                     onClick={() => pickNiveau(n)} style={{ justifyContent: 'space-between' }}>
                  <span>{n.nom}</span>
                  <span onClick={(e) => { e.stopPropagation(); delNiveau(n.id); }} style={{ color: 'var(--red)' }}>✕</span>
                </div>
              ))}
              <form className="row mt" onSubmit={addNiveau}>
                <input className="input" placeholder="Niveau (ex : M1)" value={newN} onChange={(e) => setNewN(e.target.value)} />
                <button className="btn btn-red">+</button>
              </form>
            </>
          )}
        </div>

        {/* Matières */}
        <div className="card" ref={matieresRef} style={{ scrollMarginTop: 80 }}>
          <h3>Matières {selN ? `· ${selN.nom}` : ''}</h3>
          {!selN ? <div className="muted">Sélectionnez un niveau.</div> : (
            <>
              {matieres.map((m) => (
                <div key={m.id} className="nav-item" style={{ display: 'block', cursor: 'default', padding: '8px 10px' }}>
                  <div className="row" style={{ justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <span style={{ flex: 1 }}>{m.nom}</span>
                    {semestresForNiveau(selN).length > 0 && (
                      <select className="input" style={{ width: 84, padding: '4px 6px' }} value={m.semestre || ''}
                              onChange={(e) => setMatiereSem(m.id, e.target.value)}>
                        {semestresForNiveau(selN).map((s) => <option key={s} value={s}>S{s}</option>)}
                      </select>
                    )}
                    <span onClick={() => delMatiere(m.id)} style={{ color: 'var(--red)', cursor: 'pointer' }}>✕</span>
                  </div>
                  <input className="input" style={{ marginTop: 6, padding: '4px 8px', fontSize: 13 }}
                         placeholder="Enseignant (pour l’évaluation)"
                         key={'ens-' + m.id + '|' + (m.enseignant || '')}
                         defaultValue={m.enseignant || ''}
                         onBlur={(e) => { const v = e.target.value.trim(); if (v !== (m.enseignant || '')) setMatiereEnseignant(m.id, v); }} />
                </div>
              ))}
              <form className="mt" onSubmit={addMatiere} style={{ display: 'grid', gap: 8 }}>
                <div className="row" style={{ gap: 8 }}>
                  <input className="input" placeholder="Nom de la matière" value={newM} onChange={(e) => setNewM(e.target.value)} />
                  {semestresForNiveau(selN).length > 0 && (
                    <select className="input" style={{ width: 84 }} value={newMSem} onChange={(e) => setNewMSem(e.target.value)}>
                      <option value="">S ?</option>
                      {semestresForNiveau(selN).map((s) => <option key={s} value={s}>S{s}</option>)}
                    </select>
                  )}
                  <button className="btn btn-red">+</button>
                </div>
                <input className="input" placeholder="Enseignant (facultatif)" value={newMEns} onChange={(e) => setNewMEns(e.target.value)} />
              </form>
            </>
          )}
        </div>
      </div>

      {/* Années académiques */}
      <div className="card mt">
        <h3>Années académiques</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          L'année « courante » sert de valeur par défaut (notamment pour les évaluations des enseignants).
        </p>
        {annees.map((a) => (
          <div key={a.id} className="nav-item" style={{ justifyContent: 'space-between', cursor: 'default' }}>
            <span>
              {a.libelle}
              {a.est_courante && <span className="tgt-chip on" style={{ background: 'var(--success)', marginLeft: 8 }}>courante</span>}
            </span>
            <span className="row" style={{ gap: 10 }}>
              {!a.est_courante && (
                <button className="btn btn-ghost" onClick={() => setCurrentAnnee(a.id)}>Définir courante</button>
              )}
              <span onClick={() => delAnnee(a.id)} style={{ color: 'var(--red)', cursor: 'pointer' }}>✕</span>
            </span>
          </div>
        ))}
        <form className="row mt" onSubmit={addAnnee} style={{ gap: 8 }}>
          <input className="input" placeholder="Ex : 2026-2027" value={newAnnee}
                 onChange={(e) => setNewAnnee(e.target.value)} style={{ maxWidth: 220 }} />
          <button className="btn btn-red">Ajouter l'année</button>
        </form>
      </div>
    </div>
  );
}
