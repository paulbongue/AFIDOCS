import React, { useCallback, useEffect, useState } from 'react';
import client from '../../api/client';
import Badge from '../../components/Badge';
import { ROLE_LABEL } from '../../theme';

const EMPTY = { name: '', email: '', password: '', role: 'etudiant', filiere_id: '', niveau_id: '' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [q, setQ] = useState('');
  const [roleF, setRoleF] = useState('');
  const [filiereF, setFiliereF] = useState('');

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

  async function create(e) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const payload = {
        ...form,
        filiere_id: form.filiere_id || null,
        niveau_id: form.niveau_id || null,
      };
      await client.post('/admin/users', payload);
      setMsg({ type: 'ok', text: 'Compte créé.' });
      setForm(EMPTY);
      await load();
    } catch (err) {
      setMsg({ type: 'err', text: err?.response?.data?.message || 'Création impossible.' });
    } finally { setBusy(false); }
  }

  async function remove(id) {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    await client.delete(`/admin/users/${id}`);
    await load();
  }

  // Filtrage côté client (recherche texte + rôle + filière).
  const filtered = users.filter((u) => {
    if (roleF && u.role !== roleF) return false;
    if (filiereF && String(u.filiere?.id) !== String(filiereF)) return false;
    if (q) {
      const cls = u.niveau?.nom || '';
      const hay = `${u.name} ${u.email} ${u.filiere?.code || ''} ${cls}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="page-title">Gestion des utilisateurs</div>

      {err && (
        <div className="card" style={{ borderColor: 'var(--red)', color: 'var(--red)', marginBottom: 14 }}>
          <b>Impossible de charger les comptes.</b>
          <div style={{ marginTop: 6 }}>{err}</div>
          <div className="muted" style={{ marginTop: 10 }}>
            Si le message évoque une colonne « niveau_id » manquante, relance le backend après
            <b> php artisan migrate:fresh --seed</b>.
          </div>
        </div>
      )}

      <form className="card" onSubmit={create}>
        <h3>Créer un compte</h3>
        <div className="row mt" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label className="field">Nom</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="field">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label className="field">Mot de passe</label>
            <input className="input" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
        </div>
        <div className="row mt" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label className="field">Rôle</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="etudiant">Étudiant</option>
              <option value="delegue">Délégué</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="field">Filière {form.role === 'delegue' ? '(obligatoire)' : '(optionnelle)'}</label>
            <select className="input" value={form.filiere_id}
                    onChange={(e) => setForm({ ...form, filiere_id: e.target.value, niveau_id: '' })}>
              <option value="">—</option>
              {filieres.map((f) => <option key={f.id} value={f.id}>{f.code} — {f.nom}</option>)}
            </select>
          </div>
          {form.role === 'delegue' && (
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="field">Classe / niveau (obligatoire)</label>
              <select className="input" value={form.niveau_id}
                      onChange={(e) => setForm({ ...form, niveau_id: e.target.value })} disabled={!form.filiere_id}>
                <option value="">—</option>
                {(filieres.find((f) => String(f.id) === String(form.filiere_id))?.niveaux || [])
                  .map((n) => <option key={n.id} value={n.id}>{n.nom}</option>)}
              </select>
            </div>
          )}
        </div>
        {msg && <div style={{ marginTop: 12, color: msg.type === 'ok' ? 'var(--success)' : 'var(--red)' }}>{msg.text}</div>}
        <button className="btn btn-red mt" disabled={busy}>{busy ? 'Création…' : 'Créer le compte'}</button>
      </form>

      <h3 className="mt" style={{ marginTop: 28 }}>Comptes ({filtered.length} / {users.length})</h3>

      <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <input className="input" style={{ flex: 1, minWidth: 220 }} value={q}
               onChange={(e) => setQ(e.target.value)} placeholder="Rechercher par nom, email, filière, classe…" />
        <select className="input" style={{ maxWidth: 180 }} value={roleF} onChange={(e) => setRoleF(e.target.value)}>
          <option value="">Tous les rôles</option>
          <option value="etudiant">Étudiants</option>
          <option value="delegue">Délégués</option>
          <option value="admin">Administrateurs</option>
        </select>
        <select className="input" style={{ maxWidth: 200 }} value={filiereF} onChange={(e) => setFiliereF(e.target.value)}>
          <option value="">Toutes les filières</option>
          {filieres.map((f) => <option key={f.id} value={f.id}>{f.code} — {f.nom}</option>)}
        </select>
      </div>

      <table className="tbl mt">
        <thead>
          <tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Filière / Classe</th><th></th></tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={5} className="muted" style={{ textAlign: 'center' }}>Aucun compte ne correspond.</td></tr>
          )}
          {filtered.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{ROLE_LABEL[u.role] || u.role}</td>
              <td>
                {u.filiere ? <Badge code={u.filiere.code} couleur={u.filiere.couleur} /> : '—'}
                {u.role === 'delegue' && u.niveau ? ` · ${u.niveau.nom}` : ''}
              </td>
              <td><button className="btn btn-danger" onClick={() => remove(u.id)}>Supprimer</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
