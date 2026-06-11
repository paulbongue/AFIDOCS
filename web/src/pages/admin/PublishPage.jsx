import React, { useEffect, useMemo, useState } from 'react';
import client from '../../api/client';
import Badge from '../../components/Badge';

// Publication par l'ADMIN : on peut viser PLUSIEURS matières/filières à la fois
// (utile quand des classes partagent un même cours).
export default function AdminPublishPage() {
  const [filieres, setFilieres] = useState([]);
  const [selected, setSelected] = useState([]);   // liste de matiere_id
  const [q, setQ] = useState('');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    client.get('/filieres').then(({ data }) => setFilieres(data.data || []));
  }, []);

  // Liste plate de toutes les matières, étiquetées « Filière · Niveau · Matière ».
  const matieres = useMemo(() => {
    const out = [];
    for (const f of filieres) {
      for (const n of f.niveaux || []) {
        for (const m of n.matieres || []) {
          out.push({ id: m.id, nom: m.nom, niveau: n.nom, filiere: f });
        }
      }
    }
    return out;
  }, [filieres]);

  const shown = useMemo(() => {
    if (!q) return matieres;
    const s = q.toLowerCase();
    return matieres.filter((m) =>
      `${m.filiere.code} ${m.filiere.nom} ${m.niveau} ${m.nom}`.toLowerCase().includes(s));
  }, [matieres, q]);

  // Verrou de niveau : après une 1re matière, on ne peut ajouter que des classes
  // du MÊME niveau (seules elles partagent un cours commun).
  const lockedNiveau = useMemo(() => {
    if (selected.length === 0) return null;
    return matieres.find((m) => m.id === selected[0])?.niveau || null;
  }, [selected, matieres]);

  function toggle(id) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

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
      setTitre(''); setDescription(''); setFile(null); setSelected([]); setQ('');
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
      <form className="card" style={{ maxWidth: 720 }} onSubmit={submit}>
        <label className="field">Titre</label>
        <input className="input" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre de la ressource" />

        <label className="field">Description (optionnelle)</label>
        <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

        <label className="field">
          Filières / classes destinataires {selected.length > 0 && `— ${selected.length} sélectionnée(s)`}
        </label>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)}
               placeholder="Filtrer par filière, niveau ou matière…" />
        {lockedNiveau && (
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 6 }}>
            Seules les classes de niveau « {lockedNiveau} » sont sélectionnables (cours communs).
          </div>
        )}

        <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, marginTop: 8 }}>
          {shown.length === 0 ? (
            <div className="empty" style={{ border: 'none' }}>Aucune matière.</div>
          ) : shown.map((m) => {
            const disabled = lockedNiveau && m.niveau !== lockedNiveau;
            return (
              <label key={m.id} className="spread"
                     style={{ padding: '9px 12px', borderBottom: '1px solid #EEF1F4',
                              cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}>
                <span className="row" style={{ gap: 8 }}>
                  <input type="checkbox" disabled={disabled}
                         checked={selected.includes(m.id)} onChange={() => toggle(m.id)} />
                  <Badge code={m.filiere.code} couleur={m.filiere.couleur} />
                  <span>{m.niveau} · {m.nom}</span>
                </span>
              </label>
            );
          })}
        </div>

        <label className="field">Fichier (tout type, max 50 Mo)</label>
        <input className="input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />

        {msg && <div style={{ marginTop: 12, color: msg.type === 'ok' ? 'var(--success)' : 'var(--red)' }}>{msg.text}</div>}
        <button className="btn btn-red mt" disabled={busy}>
          {busy ? 'Publication…' : `Publier${selected.length > 1 ? ` (${selected.length} classes)` : ''}`}
        </button>
      </form>
    </div>
  );
}
