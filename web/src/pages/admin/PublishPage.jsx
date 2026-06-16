import React, { useEffect, useMemo, useState } from 'react';
import client from '../../api/client';
import Badge from '../../components/Badge';
import FilePicker from '../../components/FilePicker';

// Publication ADMIN simplifiée : on déplie une filière, puis on coche des
// matières par niveau. Choix multiple, avec verrou de niveau (seules les classes
// d'un même niveau peuvent recevoir un même cours).
export default function AdminPublishPage() {
  const [filieres, setFilieres] = useState([]);
  const [expanded, setExpanded] = useState({});   // { filiereId: bool }
  const [selected, setSelected] = useState([]);    // matiere_id[]
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    client.get('/filieres').then(({ data }) => setFilieres(data.data || []));
  }, []);

  // Index matiere_id -> { niveauNom } pour gérer le verrou de niveau.
  const matInfo = useMemo(() => {
    const m = {};
    for (const f of filieres) for (const n of f.niveaux || []) for (const mat of n.matieres || []) {
      m[mat.id] = { niveauNom: n.nom };
    }
    return m;
  }, [filieres]);

  const lockedNiveau = selected.length ? matInfo[selected[0]]?.niveauNom : null;

  function toggle(id) {
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }
  function toggleFiliere(fid) {
    setExpanded((e) => ({ ...e, [fid]: !e[fid] }));
  }
  const countIn = (f) => (f.niveaux || []).reduce((s, n) =>
    s + (n.matieres || []).filter((m) => selected.includes(m.id)).length, 0);

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (selected.length === 0 || !titre || !file) {
      setMsg({ type: 'err', text: 'Choisis au moins une matière, un titre et un fichier.' });
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('titre', titre);
      fd.append('description', description);
      selected.forEach((id) => fd.append('matiere_ids[]', id));
      fd.append('fichier', file);
      const { data } = await client.post('/admin/ressources', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg({ type: 'ok', text: `Ressource publiée dans ${data.count || selected.length} classe(s).` });
      setTitre(''); setDescription(''); setFile(null); setSelected([]);
      e.target.reset?.();
    } catch (err) {
      setMsg({ type: 'err', text: err?.response?.data?.message || 'Publication impossible.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-title">Publier une ressource (admin)</div>
      <form className="card" style={{ maxWidth: 760 }} onSubmit={submit}>
        <label className="field">Titre</label>
        <input className="input" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre de la ressource" />

        <label className="field">Description (optionnelle)</label>
        <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

        <label className="field">
          Destinataires {selected.length > 0 && `— ${selected.length} matière(s) sélectionnée(s)`}
        </label>
        {lockedNiveau && (
          <div className="muted" style={{ fontSize: 12.5, fontStyle: 'italic', marginBottom: 6 }}>
            Seules les classes de niveau « {lockedNiveau} » sont sélectionnables (cours communs).
          </div>
        )}

        <div className="acc">
          {filieres.map((f) => {
            const n = countIn(f);
            return (
              <div key={f.id} className="acc-item">
                <button type="button" className="acc-head" onClick={() => toggleFiliere(f.id)}>
                  <span className="acc-head-left">
                    <Badge code={f.code} couleur={f.couleur} />
                    <span className="acc-head-nom">{f.nom}</span>
                  </span>
                  <span className="acc-head-right">
                    {n > 0 && <span className="acc-count">{n}</span>}
                    <span className="acc-chev">{expanded[f.id] ? '▾' : '▸'}</span>
                  </span>
                </button>

                {expanded[f.id] && (f.niveaux || []).map((niv) => {
                  const disabled = lockedNiveau && niv.nom !== lockedNiveau;
                  return (
                    <div key={niv.id} className={'acc-niveau' + (disabled ? ' is-disabled' : '')}>
                      <div className="acc-niveau-title">{niv.nom}</div>
                      <div className="acc-mats">
                        {(niv.matieres || []).map((m) => (
                          <label key={m.id} className={'acc-mat' + (disabled ? ' is-disabled' : '')}>
                            <input type="checkbox" checked={selected.includes(m.id)} disabled={disabled}
                                   onChange={() => toggle(m.id)} />
                            <span>{m.nom}</span>
                          </label>
                        ))}
                        {(niv.matieres || []).length === 0 && <span className="muted" style={{ fontSize: 13 }}>Aucune matière.</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <label className="field">Fichier (tout type, max 50 Mo)</label>
        <FilePicker file={file} onChange={setFile} hint="PDF, Word, PPT, Excel, image, vidéo — max 50 Mo" />

        {msg && <div style={{ marginTop: 12, color: msg.type === 'ok' ? 'var(--success)' : 'var(--red)' }}>{msg.text}</div>}
        <button className="btn btn-red mt" disabled={busy}>
          {busy ? 'Publication…' : `Publier${selected.length > 1 ? ` (${selected.length} class