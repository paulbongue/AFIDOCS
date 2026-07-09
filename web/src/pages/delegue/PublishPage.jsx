import React, { useEffect, useState } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import FilePicker from '../../components/FilePicker';

// Publication directe par le délégué — la CLASSE (filière + niveau) est
// PRÉ-SÉLECTIONNÉE et VERROUILLÉE. Le délégué ne publie que dans les matières
// de sa classe.
export default function PublishPage() {
  const { user } = useAuth();
  const [filiere, setFiliere] = useState(null);
  const [niveau, setNiveau] = useState(null);
  const [matiereId, setMatiereId] = useState('');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    client.get('/filieres').then(({ data }) => {
      const f = (data.data || []).find((x) => x.id === user?.filiere_id);
      setFiliere(f || null);
      setNiveau((f?.niveaux || []).find((n) => n.id === user?.niveau_id) || null);
    });
  }, [user]);

  const matieres = niveau?.matieres || [];
  const sansClasse = !user?.niveau_id;

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!matiereId || !titre || !file) {
      setMsg({ type: 'err', text: 'Matière, titre et fichier sont obligatoires.' });
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('titre', titre);
      fd.append('description', description);
      fd.append('matiere_id', matiereId);
      fd.append('fichier', file);
      await client.post('/ressources', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg({ type: 'ok', text: 'Ressource publiée et immédiatement disponible.' });
      setTitre(''); setDescription(''); setFile(null); setMatiereId('');
      e.target.reset?.();
    } catch (err) {
      setMsg({ type: 'err', text: err?.response?.data?.message || 'Publication impossible.' });
    } finally {
      setBusy(false);
    }
  }

  if (sansClasse) {
    return (
      <div>
        <div className="page-title">Publier une ressource</div>
        <div className="card">
          <p>Aucune classe ne vous est assignée. Contactez l'administrateur pour être désigné
            délégué d'une classe avant de pouvoir publier.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, marginInline: 'auto' }}>
      <div className="page-title">Publier une ressource</div>

      <form className="card" onSubmit={submit}>
        <label className="field">Ma classe (verrouillée)</label>
        <input className="input"
               value={filiere && niveau ? `${filiere.code} — ${filiere.nom} · ${niveau.nom}` : 'Chargement…'}
               disabled />

        <label className="field">Matière</label>
        <select className="input" value={matiereId} onChange={(e) => setMatiereId(e.target.value)}>
          <option value="">Choisir une matière de la classe…</option>
          {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
        </select>

        <label className="field">Titre</label>
        <input className="input" value={titre} onChange={(e) => setTitre(e.target.value)}
               placeholder="Ex : Cours de bases de données — chapitre 1" />

        <label className="field">Description (optionnelle)</label>
        <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />

        <label className="field">Fichier (PDF, DOCX, PPTX, XLSX, image, vidéo — max 250 Mo)</label>
        <FilePicker file={file} onChange={setFile}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.mp4"
                    hint="PDF, Word, PPT, Excel, image, vidéo — max 250 Mo" />

        {msg && (
          <div style={{ marginTop: 12, color: msg.type === 'ok' ? 'var(--success)' : 'var(--red)' }}>{msg.text}</div>
        )}
        <button className="btn btn-red mt" disabled={busy}>{busy ? 'Publication…' : 'Publier'}</button>
      </form>
    </div>
  );
}
