import React, { useEffect, useMemo, useState } from 'react';
import client from '../../api/client';

const uniq = (arr) => [...new Set(arr.filter(Boolean))];
const noteColor = (n) => (n >= 14 ? '#166534' : n >= 10 ? '#92400e' : '#991b1b');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export default function AdminEvaluationsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fAnnee, setFAnnee] = useState('');
  const [fFiliere, setFFiliere] = useState('');
  const [fNiveau, setFNiveau] = useState('');
  const [fSemestre, setFSemestre] = useState('');
  const [fModule, setFModule] = useState('');
  const [onlyComplete, setOnlyComplete] = useState(false);

  useEffect(() => {
    client.get('/admin/evaluations')
      .then(({ data }) => setRows(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const annees = useMemo(() => uniq(rows.map((r) => r.annee)), [rows]);
  const filieres = useMemo(() => uniq(rows.map((r) => r.filiere)), [rows]);
  const niveaux = useMemo(() => uniq(rows.map((r) => r.niveau)), [rows]);
  const semestres = useMemo(() => uniq(rows.map((r) => r.semestre)).sort((a, b) => a - b), [rows]);
  // Modules proposés dans la liste déroulante : dépendent des filtres déjà choisis
  // (année / filière / niveau / semestre), pour ne montrer que les modules pertinents.
  const modules = useMemo(() => uniq(
    rows.filter((r) =>
      (!fAnnee || r.annee === fAnnee) &&
      (!fFiliere || r.filiere === fFiliere) &&
      (!fNiveau || r.niveau === fNiveau) &&
      (String(fSemestre) === '' || String(r.semestre) === String(fSemestre)))
      .map((r) => r.module)).sort((a, b) => String(a).localeCompare(String(b))),
    [rows, fAnnee, fFiliere, fNiveau, fSemestre]);

  const filtered = rows.filter((r) =>
    (!fAnnee || r.annee === fAnnee) &&
    (!fFiliere || r.filiere === fFiliere) &&
    (!fNiveau || r.niveau === fNiveau) &&
    (String(fSemestre) === '' || String(r.semestre) === String(fSemestre)) &&
    (!fModule || r.module === fModule));

  const forPrint = onlyComplete ? filtered.filter((r) => r.complet) : filtered;

  // Génère un document imprimable groupé par enseignant (fiche par professeur).
  function printReport() {
    if (forPrint.length === 0) { alert('Aucune évaluation à imprimer pour ces critères.'); return; }

    const byProf = {};
    forPrint.forEach((r) => { (byProf[r.enseignant || '—'] ||= []).push(r); });
    const profs = Object.keys(byProf).sort();
    const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    const filtres = [
      fAnnee && `Année : ${fAnnee}`, fFiliere && `Filière : ${fFiliere}`,
      fNiveau && `Niveau : ${fNiveau}`, fSemestre !== '' && `Semestre : S${fSemestre}`,
      fModule && `Module : ${fModule}`,
      onlyComplete && 'Participation ≥ 80 % uniquement',
    ].filter(Boolean).join(' · ') || 'Tous les résultats';

    const sections = profs.map((prof) => {
      const list = byProf[prof].slice().sort((a, b) =>
        a.filiere.localeCompare(b.filiere) || a.niveau.localeCompare(b.niveau) || a.semestre - b.semestre);
      const moyProf = (list.reduce((s, r) => s + r.moyenne, 0) / list.length).toFixed(2);
      const lignes = list.map((r) => `
        <tr>
          <td>${esc(r.module)}</td>
          <td>${esc(r.filiere)} · ${esc(r.niveau)}</td>
          <td class="c">S${esc(r.semestre)}</td>
          <td class="c">${esc(r.annee)}</td>
          <td class="c">${r.nb}/${r.attendus || '—'} (${r.taux}%)${r.complet ? ' ✓' : ''}</td>
          <td class="c b">${r.moyenne.toFixed(2)}</td>
        </tr>`).join('');
      return `
        <section>
          <h2>${esc(prof)} <span class="moy">Moyenne générale : ${moyProf}/20</span></h2>
          <table>
            <thead><tr>
              <th>Module</th><th>Classe</th><th class="c">Sem.</th><th class="c">Année</th>
              <th class="c">Participation</th><th class="c">Note /20</th>
            </tr></thead>
            <tbody>${lignes}</tbody>
          </table>
        </section>`;
    }).join('');

    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
      <title>Évaluations des enseignants — AFI-DOCS</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #14213D; margin: 32px; }
        header { border-bottom: 3px solid #C0392B; padding-bottom: 10px; margin-bottom: 18px; }
        h1 { font-size: 18px; margin: 0; color: #C0392B; }
        .sub { font-size: 12px; color: #555; margin-top: 4px; }
        section { margin-bottom: 22px; page-break-inside: avoid; }
        h2 { font-size: 14px; margin: 0 0 8px; border-left: 4px solid #C0392B; padding-left: 8px; }
        .moy { float: right; font-size: 12px; font-weight: normal; color: #14213D; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f3f4f6; }
        .c { text-align: center; } .b { font-weight: 700; }
        footer { margin-top: 24px; font-size: 10px; color: #888; text-align: center; }
        @media print { body { margin: 12mm; } }
      </style></head><body>
      <header>
        <h1>AFI-DOCS — Évaluations des enseignants</h1>
        <div class="sub">${esc(filtres)} · Édité le ${esc(today)}</div>
      </header>
      ${sections}
      <footer>Notes calculées sur la grille officielle AFI-L'UE (15 critères /20) — évaluations anonymes des étudiants.</footer>
      </body></html>`;

    const w = window.open('', '_blank');
    if (!w) { alert('Autorisez les fenêtres pop-up pour imprimer.'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }

  return (
    <div>
      <div className="page-title">Résultats des évaluations</div>
      <p className="muted" style={{ marginTop: 0 }}>
        Note générale de chaque enseignant par module, calculée à partir des évaluations
        des étudiants (moyenne des 15 critères, /20). La participation indique combien
        d’étudiants ont voté sur l’effectif de la classe : dès <strong>80 %</strong>, le
        rapport peut être imprimé à partir des données disponibles.
      </p>

      <div className="card">
        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label className="field">Année académique</label>
            <select className="input" value={fAnnee} onChange={(e) => setFAnnee(e.target.value)}>
              <option value="">Toutes</option>
              {annees.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label className="field">Filière</label>
            <select className="input" value={fFiliere} onChange={(e) => setFFiliere(e.target.value)}>
              <option value="">Toutes</option>
              {filieres.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label className="field">Niveau</label>
            <select className="input" value={fNiveau} onChange={(e) => setFNiveau(e.target.value)}>
              <option value="">Tous</option>
              {niveaux.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label className="field">Semestre</label>
            <select className="input" value={fSemestre} onChange={(e) => setFSemestre(e.target.value)}>
              <option value="">Tous</option>
              {semestres.map((s) => <option key={s} value={s}>S{s}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label className="field">Module</label>
            <select
              className="input"
              value={modules.includes(fModule) ? fModule : ''}
              onChange={(e) => setFModule(e.target.value)}
            >
              <option value="">Tous les modules</option>
              {modules.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="row mt" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <label className="row" style={{ gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" checked={onlyComplete} onChange={(e) => setOnlyComplete(e.target.checked)} />
            <span>N’imprimer que les classes ayant atteint <strong>80 %</strong> de participation</span>
          </label>
          <button className="btn btn-red" onClick={printReport} disabled={loading || forPrint.length === 0}>
            🖨 {fModule ? `Imprimer les notes du module « ${fModule} »` : 'Imprimer les notes par professeur'}
          </button>
        </div>
      </div>

      <div className="mt">
        {loading ? <div className="empty">Chargement…</div>
          : filtered.length === 0 ? <div className="empty">Aucune évaluation pour ces critères.</div>
          : (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: 'var(--panel, #f8f8f8)' }}>
                    <th style={{ padding: 10 }}>Année</th>
                    <th style={{ padding: 10 }}>Filière</th>
                    <th style={{ padding: 10 }}>Niveau</th>
                    <th style={{ padding: 10 }}>Sem.</th>
                    <th style={{ padding: 10 }}>Module</th>
                    <th style={{ padding: 10 }}>Enseignant</th>
                    <th style={{ padding: 10, textAlign: 'center' }}>Participation</th>
                    <th style={{ padding: 10, textAlign: 'right' }}>Note /20</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border, #eee)' }}>
                      <td style={{ padding: 10 }}>{r.annee}</td>
                      <td style={{ padding: 10 }}>{r.filiere}</td>
                      <td style={{ padding: 10 }}>{r.niveau}</td>
                      <td style={{ padding: 10 }}>S{r.semestre}</td>
                      <td style={{ padding: 10 }}>{r.module}</td>
                      <td style={{ padding: 10 }}>{r.enseignant}</td>
                      <td style={{ padding: 10, textAlign: 'center' }}>
                        {r.nb}/{r.attendus || '—'} ({r.taux}%){' '}
                        {r.complet
                          ? <span title="Seuil de 80 % atteint — imprimable" style={{ color: '#166534', fontWeight: 700 }}>✓ prêt</span>
                          : <span className="muted" style={{ fontSize: 12 }}>&lt; 80 %</span>}
                      </td>
                      <td style={{ padding: 10, textAlign: 'right', fontWeight: 700, color: noteColor(r.moyenne) }}>
                        {r.moyenne.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
