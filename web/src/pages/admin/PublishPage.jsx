import React, { useEffect, useMemo, useState } from 'react';
import client from '../../api/client';

// Publication par l'ADMIN : libre choix de la filière, du niveau et de la matière.
export default function AdminPublishPage() {
  const [filieres, setFilieres] = useState([]);
  const [f, setF] = useState('');
  const [n, setN] = useState('');
  const [matiereId, setMatiereId] = useState('');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    client.get('/filieres').then(({ data }) => setFilieres(data.data || []));
  }, []);

  const niveaux = useMemo(() => filieres.find((x) => String(x.id) === f)?.niveaux || [], [filieres, f]);
  const matieres = useMemo(() => niveaux.find((x) => String(x.id) === n)?.matieres || [], [niveaux, n]);

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!matiereId || !titre || !file) {
      setMsg({ type: 'err', text: 'Filière, niveau, matière, titre et fichier sont obligatoires.' });
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('titre', titre);
      fd.append('description', description);
      fd.append('matiere_id', matiereId);
      fd.append('fichier', file);
      await client.post('/admin/ressources', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg({ type: 'ok', text: 'Ressource publiée.' });
      setTitre(''); setDescription(''); setFile(null); setMatiereId(''); setN(''); setF('');
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
      <form className="card" style={{ maxWidth: 640 }} onSubmit={submit}>
        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="field">Filière</label>
            <select className="input" value={f} onChange={(e) => { setF(e.target.value); setN(''); setMatiereId(''); }}>
              <option value="">Choisir…</option>
              {filieres.map((x) => <option key={x.id} value={x.id}>{x.code} — {x.nom}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label className="field">Niveau</label>
            <select className="input" value={n} onChange={(e) => { setN(e.target.value); setMatiereId(''); }} disabled={!f}>
              <option value="">Choisir…</option>
              {niveaux.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label className="field">Matière</label>
            <select className="input" value={matiereId} onChange={(e) => setMatiereId(e.target.value)} disabled={!n}>
              <option value="">Choisir…</option>
              {matieres.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
            </select>
          </div>
        </div>

        <label className="field">Titre</label>
        <input className="input" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre de la ressource" />

        <label className="field">Description (optionnelle)</label>
        <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />

        <label className="field">Fichier (PDF, DOCX, PPTX, XLSX, image, vidéo — max 50 Mo)</label>
        <input className="input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
               accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.mp4" />

        {msg && <div style={{ marginTop: 12, color: msg.type === 'ok' ? 'var(--success)' : 'var(--red)' }}>{msg.text}</div>}
        <button className="btn btn-red mt" disabled={busy}>{busy ? 'Publication…' : 'Publier'}</button>
      </form>
    </div>
  );
}
