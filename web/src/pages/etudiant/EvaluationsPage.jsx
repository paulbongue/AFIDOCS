import React, { useEffect, useMemo, useState } from 'react';
import client from '../../api/client';

// Barème proposé : 0 à 20 (la moyenne des 15 indicateurs donne la note du module).
const NOTES = Array.from({ length: 21 }, (_, i) => 20 - i); // 20 → 0

export default function EvaluationsPage() {
  const [modules, setModules] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [annee, setAnnee] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null); // module en cours d'évaluation
  const [notes, setNotes] = useState([]);          // 15 notes
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  function loadModules() {
    setLoading(true);
    client.get('/evaluations/modules')
      .then(({ data }) => { setModules(data.data || []); setAnnee(data.annee || null); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadModules();
    client.get('/evaluations/questions').then(({ data }) => setQuestions(data.data || [])).catch(() => {});
  }, []);

  function openForm(m) {
    setSelected(m);
    setNotes(Array(questions.length || 15).fill(''));
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const moyenne = useMemo(() => {
    const filled = notes.filter((v) => v !== '');
    if (filled.length === 0) return null;
    const sum = filled.reduce((a, v) => a + Number(v), 0);
    return (sum / filled.length).toFixed(2);
  }, [notes]);

  function submit(e) {
    e.preventDefault();
    if (notes.some((v) => v === '')) {
      setError('Merci de noter les 15 critères avant d’envoyer.');
      return;
    }
    setSubmitting(true);
    setError('');
    client.post('/evaluations', {
      matiere_id: selected.matiere_id,
      reponses: notes.map(Number),
    })
      .then(({ data }) => {
        setFlash(`${selected.module} évalué (note ${data.data.note}/20). Merci !`);
        setSelected(null);
        loadModules();
      })
      .catch((err) => setError(err?.response?.data?.message || 'Envoi impossible.'))
      .finally(() => setSubmitting(false));
  }

  // --- Formulaire de la grille -------------------------------------------------
  if (selected) {
    return (
      <div>
        <div className="page-title">Évaluer : {selected.module}</div>
        <p className="muted" style={{ marginTop: 0 }}>
          Enseignant : <strong>{selected.enseignant}</strong> · Semestre S{selected.semestre}
          {annee ? ` · ${annee.libelle}` : ''}
        </p>

        <form className="card" onSubmit={submit}>
          <p className="muted" style={{ marginTop: 0 }}>
            Notez chaque critère de 0 à 20. La note du module est la moyenne des 15 critères.
            Votre évaluation est <strong>anonyme</strong> pour l’enseignant.
          </p>

          {questions.map((q, i) => (
            <div key={i} className="row" style={{ gap: 12, alignItems: 'center',
              padding: '8px 0', borderTop: i ? '1px solid var(--border, #eee)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <span className="muted" style={{ marginRight: 6 }}>{i + 1}.</span>{q}
              </div>
              <select className="input" style={{ width: 90 }} value={notes[i] ?? ''}
                      onChange={(e) => setNotes((prev) => {
                        const next = [...prev]; next[i] = e.target.value; return next;
                      })}>
                <option value="">—</option>
                {NOTES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          ))}

          <div className="row mt" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>{moyenne !== null && <span>Moyenne provisoire : <strong>{moyenne}/20</strong></span>}</div>
            <div className="row" style={{ gap: 8 }}>
              <button type="button" className="btn" onClick={() => setSelected(null)}>Annuler</button>
              <button className="btn btn-red" disabled={submitting}>
                {submitting ? 'Envoi…' : 'Envoyer l’évaluation'}
              </button>
            </div>
          </div>
          {error && <p style={{ color: 'crimson', marginBottom: 0 }}>{error}</p>}
        </form>
      </div>
    );
  }

  // --- Liste des modules -------------------------------------------------------
  return (
    <div>
      <div className="page-title">Évaluation des enseignants</div>
      <p className="muted" style={{ marginTop: 0 }}>
        Évaluez les enseignants de vos modules{annee ? ` — année ${annee.libelle}` : ''}.
        Chaque module ne peut être évalué qu’une fois par année.
      </p>

      {flash && <div className="card" style={{ borderColor: '#16a34a', color: '#166534' }}>{flash}</div>}

      {loading ? <div className="empty">Chargement…</div>
        : modules.length === 0 ? (
          <div className="empty">Aucun module à évaluer pour le moment (l’enseignant doit être renseigné par l’administration).</div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            {modules.map((m, i) => (
              <div key={m.matiere_id} className="row" style={{ gap: 12, alignItems: 'center',
                padding: 14, borderTop: i ? '1px solid var(--border, #eee)' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{m.module}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {m.enseignant} · S{m.semestre}
                  </div>
                </div>
                {m.deja_evalue
                  ? <span className="badge" style={{ color: '#166534', background: '#dcfce7' }}>✓ Déjà évalué</span>
                  : <button className="btn btn-red" onClick={() => openForm(m)}>Évaluer</button>}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
