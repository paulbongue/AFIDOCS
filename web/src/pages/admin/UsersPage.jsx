import React, { useCallback, useEffect, useState } from 'react';
import client from '../../api/client';
import Badge from '../../components/Badge';
import Pagination, { usePagination } from '../../components/Pagination';
import { ROLE_LABEL } from '../../theme';

const NEW = { prenom: '', nom: '', email_contact: '', password: '', role: 'etudiant', filiere_id: '', niveau_id: '' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [err, setErr] = useState(null);

  // Création (prénom + nom, identifiant généré) — masquée derrière un bouton.
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(NEW);

  // Édition d'un compte existant (nom complet + email modifiables).
  const [editForm, setEditForm] = useState(null); // null = pas d'édition

  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [csvBusy, setCsvBusy] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const [q, setQ] = useState('');
  const [roleF, setRoleF] = useState('etudiant'); // par défaut : les étudiants
  const [filiereF, setFiliereF] = useState('');
  const [niveauF, setNiveauF] = useState('');     // filtre niveau/classe

  const load = useCallback(async () => {
    try {
      const [u, f] = await Promise.all([client.get('/admin/users'), client.get('/filieres')]);
      setUsers(u.data.data || []);
      setFilieres(f.data.data || []);
      setErr(null);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Erreur de chargement des comptes.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const niveauxOf = (fid) => (filieres.find((f) => String(f.id) === String(fid))?.niveaux || []);

  // ----- Création -----
  async function create(e) {
    e.preventDefault();
    setMsg(null);
    if (!form.prenom.trim() || !form.nom.trim() || !form.password) {
      setMsg({ type: 'err', text: 'Prénom, nom et mot de passe sont requis.' });
      return;
    }
    setBusy(true);
    try {
      const payload = { ...form, filiere_id: form.filiere_id || null, niveau_id: form.niveau_id || null };
      const { data } = await client.post('/admin/users', payload);
      setMsg({ type: 'ok', text: `Compte créé. Identifiant de connexion : ${data.data?.email}` });
      setForm(NEW);
      setCreating(false);
      await load();
    } catch (err) {
      setMsg({ type: 'err', text: err?.response?.data?.message || 'Création impossible.' });
    } finally { setBusy(false); }
  }

  // ----- Import CSV -----
  async function importCsv(file) {
    if (!file) return;
    setCsvBusy(true); setCsvResult(null); setMsg(null);
    try {
      const fd = new FormData();
      fd.append('fichier', file);
      const { data } = await client.post('/admin/users/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCsvResult(data);
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e?.response?.data?.message || 'Import impossible.' });
    } finally { setCsvBusy(false); }
  }

  // ----- Édition -----
  function startEdit(u) {
    setEditForm({
      id: u.id, name: u.name || '', email: u.email || '', password: '',
      role: u.role || 'etudiant',
      filiere_id: u.filiere?.id ? String(u.filiere.id) : '',
      niveau_id: u.niveau?.id ? String(u.niveau.id) : '',
    });
    setCreating(false);
    setMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveEdit(e) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const payload = {
        name: editForm.name, email: editForm.email, role: editForm.role,
        filiere_id: editForm.filiere_id || null, niveau_id: editForm.niveau_id || null,
      };
      if (editForm.password) payload.password = editForm.password;
      await client.put(`/admin/users/${editForm.id}`, payload);
      setMsg({ type: 'ok', text: 'Compte modifié.' });
      setEditForm(null);
      await load();
    } catch (err) {
      setMsg({ type: 'err', text: err?.response?.data?.message || 'Modification impossible.' });
    } finally { setBusy(false); }
  }

  async function remove(id) {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    await client.delete(`/admin/users/${id}`);
    await load();
  }

  // Niveaux de la filière filtrée (pour le sous-filtre par classe).
  const filterNiveaux = niveauxOf(filiereF);

  // Filtrage (rôle + filière + niveau + recherche texte).
  const filtered = users.filter((u) => {
    if (roleF && u.role !== roleF) return false;
    if (filiereF && String(u.filiere?.id) !== String(filiereF)) return false;
    if (niveauF && String(u.niveau?.id) !== String(niveauF)) return false;
    if (q) {
      const hay = `${u.name} ${u.email} ${u.filiere?.code || ''} ${u.niveau?.nom || ''}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const pg = usePagination(filtered, 10);

  return (
    <div>
      <div className="spread" style={{ gap: 12 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>Gestion des utilisateurs</div>
        <div className="row" style={{ gap: 8 }}>
          <label className="btn btn-ghost" style={{ cursor: csvBusy ? 'default' : 'pointer', opacity: csvBusy ? 0.6 : 1 }}>
            {csvBusy ? 'Import…' : '⬆ Importer un CSV'}
            <input type="file" accept=".csv,text/csv" hidden disabled={csvBusy}
                   onChange={(e) => { importCsv(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          <button className="btn btn-red" onClick={() => { setCreating((c) => !c); setEditForm(null); setForm(NEW); setMsg(null); }}>
            {creating ? 'Fermer' : '+ Nouveau compte'}
          </button>
        </div>
      </div>

      {csvResult && (
        <div className="card mt" style={{ borderColor: csvResult.errors?.length ? 'var(--red)' : 'var(--success)' }}>
          <b>{csvResult.message}</b> — mot de passe par défaut : <code>{csvResult.default_password}</code> (à changer à la 1re connexion).
          {csvResult.detected && (
            <div className="muted" style={{ marginTop: 8, fontSize: 12.5 }}>
              Colonnes reconnues :{' '}
              {[
                ['Prénom', csvResult.detected.prenom],
                ['Nom', csvResult.detected.nom],
                ['Nom complet', csvResult.detected.fullname],
                ['E-mail', csvResult.detected.email],
                ['Filière', csvResult.detected.filiere],
                ['Niveau', csvResult.detected.niveau],
              ].filter(([, v]) => v).map(([k, v]) => `${k} → « ${v} »`).join(' · ') || 'aucune'}
            </div>
          )}
          {csvResult.errors?.length > 0 && (
            <ul style={{ marginTop: 8, color: 'var(--red)' }}>
              {csvResult.errors.slice(0, 20).map((er, i) => <li key={i}>{er}</li>)}
              {csvResult.errors.length > 20 && <li>… et {csvResult.errors.length - 20} autre(s) ligne(s) en erreur.</li>}
            </ul>
          )}
          <div className="muted" style={{ marginTop: 8, fontSize: 12.5 }}>
            Le fichier doit contenir prénom, nom, e-mail, filière (code ou nom, ex. GL) et niveau (ex. L3).
            Les intitulés de colonnes sont reconnus automatiquement (synonymes FR/EN, colonne « Nom complet »,
            ou détection par le contenu) — l'ordre et les noms exacts n'ont pas d'importance. Séparateur « ; », « , » ou tabulation.
          </div>
        </div>
      )}

      {err && (
        <div className="card" style={{ borderColor: 'var(--red)', color: 'var(--red)', margin: '14px 0' }}>
          <b>Impossible de charger les comptes.</b>
          <div style={{ marginTop: 6 }}>{err}</div>
        </div>
      )}

      {/* Formulaire de CRÉATION (identifiant généré automatiquement) */}
      {creating && (
        <form className="card mt" onSubmit={create}>
          <h3>Nouveau compte</h3>
          <div className="row mt" style={{ gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="field">Prénom</label>
              <input className="input" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="field">Nom</label>
              <input className="input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="field">Mot de passe</label>
              <input className="input" type="text" value={form.password}
                     onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <div className="row mt" style={{ gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <label className="field">E-mail réel (facultatif — pour l'envoi automatique des accès)</label>
              <input className="input" type="email" value={form.email_contact}
                     placeholder="prenom.nom@gmail.com"
                     onChange={(e) => setForm({ ...form, email_contact: e.target.value })} />
            </div>
          </div>
          <div className="row mt" style={{ gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label className="field">Rôle</label>
              <select className="input" value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value, niveau_id: '', filiere_id: e.target.value === 'admin' ? '' : form.filiere_id })}>
                <option value="etudiant">Étudiant</option>
                <option value="delegue">Délégué</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
            {/* L'Administrateur n'a pas de filière : le champ n'apparaît pas pour ce rôle. */}
            {form.role !== 'admin' && (
              <div style={{ flex: 1, minWidth: 180 }}>
                <label className="field">Filière {form.role === 'delegue' ? '(obligatoire)' : '(optionnelle)'}</label>
                <select className="input" value={form.filiere_id}
                        onChange={(e) => setForm({ ...form, filiere_id: e.target.value, niveau_id: '' })}>
                  <option value="">—</option>
                  {filieres.map((f) => <option key={f.id} value={f.id}>{f.code} — {f.nom}</option>)}
                </select>
              </div>
            )}
            {form.role !== 'admin' && (
              <div style={{ flex: 1, minWidth: 150 }}>
                <label className="field">Niveau / Classe {form.role === 'delegue' ? '(obligatoire)' : '(optionnel)'}</label>
                <select className="input" value={form.niveau_id} disabled={!form.filiere_id}
                        onChange={(e) => setForm({ ...form, niveau_id: e.target.value })}>
                  <option value="">—</option>
                  {niveauxOf(form.filiere_id).map((n) => <option key={n.id} value={n.id}>{n.nom}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
            L'identifiant de connexion sera généré automatiquement à partir du prénom, du nom, de la filière et du niveau.
          </div>
          {msg && <div style={{ marginTop: 12, color: msg.type === 'ok' ? 'var(--success)' : 'var(--red)' }}>{msg.text}</div>}
          <button className="btn btn-red mt" disabled={busy}>{busy ? 'Création…' : 'Créer le compte'}</button>
        </form>
      )}

      {/* Formulaire d'ÉDITION */}
      {editForm && (
        <form className="card mt" onSubmit={saveEdit}>
          <h3>Modifier le compte</h3>
          <div className="row mt" style={{ gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label className="field">Nom complet</label>
              <input className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label className="field">Identifiant (email)</label>
              <input className="input" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label className="field">Mot de passe (vide = inchangé)</label>
              <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                <input className="input" type="text" style={{ flex: 1 }} value={editForm.password}
                       placeholder="Nouveau mot de passe…"
                       onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
                <button type="button" className="btn btn-ghost" style={{ whiteSpace: 'nowrap' }}
                        onClick={() => setEditForm({ ...editForm, password: 'Afi@2026' })}>
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
          <div className="row mt" style={{ gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label className="field">Rôle</label>
              <select className="input" value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value, niveau_id: '', filiere_id: e.target.value === 'admin' ? '' : editForm.filiere_id })}>
                <option value="etudiant">Étudiant</option>
                <option value="delegue">Délégué</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
            {/* Pas de filière pour un Administrateur. */}
            {editForm.role !== 'admin' && (
              <div style={{ flex: 1, minWidth: 180 }}>
                <label className="field">Filière</label>
                <select className="input" value={editForm.filiere_id}
                        onChange={(e) => setEditForm({ ...editForm, filiere_id: e.target.value, niveau_id: '' })}>
                  <option value="">—</option>
                  {filieres.map((f) => <option key={f.id} value={f.id}>{f.code} — {f.nom}</option>)}
                </select>
              </div>
            )}
            {editForm.role !== 'admin' && (
              <div style={{ flex: 1, minWidth: 150 }}>
                <label className="field">Niveau / Classe</label>
                <select className="input" value={editForm.niveau_id} disabled={!editForm.filiere_id}
                        onChange={(e) => setEditForm({ ...editForm, niveau_id: e.target.value })}>
                  <option value="">—</option>
                  {niveauxOf(editForm.filiere_id).map((n) => <option key={n.id} value={n.id}>{n.nom}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
            Si vous définissez un nouveau mot de passe, l'étudiant récupère l'accès avec ce mot de passe
            et devra le changer à sa prochaine connexion.
          </div>
          {msg && <div style={{ marginTop: 12, color: msg.type === 'ok' ? 'var(--success)' : 'var(--red)' }}>{msg.text}</div>}
          <div className="row mt">
            <button className="btn btn-red" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditForm(null)}>Annuler</button>
          </div>
        </form>
      )}

      {!creating && !editForm && msg && (
        <div className="mt" style={{ color: msg.type === 'ok' ? 'var(--success)' : 'var(--red)' }}>{msg.text}</div>
      )}

      <h3 className="mt" style={{ marginTop: 28 }}>Comptes ({filtered.length})</h3>

      <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <input className="input" style={{ flex: 1, minWidth: 200 }} value={q}
               onChange={(e) => setQ(e.target.value)} placeholder="Rechercher par nom, email, filière, classe…" />
        <select className="input" style={{ maxWidth: 180 }} value={roleF} onChange={(e) => setRoleF(e.target.value)}>
          <option value="">Tous les rôles</option>
          <option value="etudiant">Étudiants</option>
          <option value="delegue">Délégués</option>
          <option value="admin">Administrateurs</option>
        </select>
        <select className="input" style={{ maxWidth: 200 }} value={filiereF}
                onChange={(e) => { setFiliereF(e.target.value); setNiveauF(''); }}>
          <option value="">Toutes les filières</option>
          {filieres.map((f) => <option key={f.id} value={f.id}>{f.code} — {f.nom}</option>)}
        </select>
        {filiereF && (
          <select className="input" style={{ maxWidth: 170 }} value={niveauF} onChange={(e) => setNiveauF(e.target.value)}>
            <option value="">Tous les niveaux</option>
            {filterNiveaux.map((n) => <option key={n.id} value={n.id}>{n.nom}</option>)}
          </select>
        )}
      </div>

      <table className="tbl">
        <thead>
          <tr><th>Nom</th><th>Identifiant</th><th>Rôle</th><th>Filière / Classe</th><th></th></tr>
        </thead>
        <tbody>
          {pg.pageItems.length === 0 && (
            <tr><td colSpan={5} className="muted" style={{ textAlign: 'center' }}>Aucun compte ne correspond.</td></tr>
          )}
          {pg.pageItems.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{ROLE_LABEL[u.role] || u.role}</td>
              <td>
                {u.filiere ? <Badge code={u.filiere.code} couleur={u.filiere.couleur} /> : '—'}
                {u.niveau ? ` · ${u.niveau.nom}` : ''}
              </td>
              <td>
                <div className="row" style={{ gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost" onClick={() => startEdit(u)}>Modifier</button>
                  <button className="btn btn-danger" onClick={() => remove(u.id)}>Supprimer</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination {...pg} />
    </div>
  );
}
