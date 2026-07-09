import React, { useCallback, useEffect, useState } from 'react';
import client from '../../api/client';
import Badge from '../../components/Badge';
import Pagination, { usePagination } from '../../components/Pagination';

// Centre de contrôle : désigner / révoquer le délégué de chaque CLASSE (niveau).
export default function ControlCenterPage() {
  const [classes, setClasses] = useState([]);
  const [candidats, setCandidats] = useState([]);
  const [picks, setPicks] = useState({});       // { niveau_id: user_id sélectionné }
  const [open, setOpen] = useState({});         // { niveau_id: liste des élèves dépliée }
  const [filtreFiliere, setFiltreFiliere] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/admin/classes');
      setClasses(data.classes || []);
      setCandidats(data.candidats || []);
      setErr(null);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function designate(niveauId) {
    const userId = picks[niveauId];
    if (!userId) { setMsg({ type: 'err', text: 'Sélectionnez d\'abord un utilisateur.' }); return; }
    setMsg(null);
    try {
      await client.post(`/admin/classes/${niveauId}/delegue`, { user_id: userId });
      setPicks((p) => ({ ...p, [niveauId]: '' }));
      await load();
      setMsg({ type: 'ok', text: 'Délégué désigné.' });
    } catch (err) {
      setMsg({ type: 'err', text: err?.response?.data?.message || 'Action impossible.' });
    }
  }

  async function revoke(niveauId, userId) {
    if (!confirm('Révoquer ce délégué ? Il redeviendra étudiant.')) return;
    await client.delete(`/admin/classes/${niveauId}/delegue/${userId}`);
    await load();
    setMsg({ type: 'ok', text: 'Délégué révoqué.' });
  }

  async function deleteEleve(userId, name) {
    if (!confirm(`Supprimer définitivement l'élève « ${name} » ? Cette action est irréversible.`)) return;
    setMsg(null);
    try {
      await client.delete(`/admin/users/${userId}`);
      await load();
      setMsg({ type: 'ok', text: 'Élève supprimé.' });
    } catch (e) {
      setMsg({ type: 'err', text: e?.response?.data?.message || 'Suppression impossible.' });
    }
  }

  async function clearClass(niveauId, label, effectif) {
    if (!effectif) { setMsg({ type: 'err', text: 'Cette classe est déjà vide.' }); return; }
    if (!confirm(`Vider la classe « ${label} » ?\n\nCela supprimera définitivement les ${effectif} étudiant(s) et délégué(s) de cette classe. Action irréversible.`)) return;
    if (!confirm('Dernière confirmation : supprimer tous les étudiants de cette classe ?')) return;
    setMsg(null);
    try {
      const { data } = await client.delete(`/admin/classes/${niveauId}/etudiants`);
      await load();
      setMsg({ type: 'ok', text: data?.message || 'Classe vidée.' });
    } catch (e) {
      setMsg({ type: 'err', text: e?.response?.data?.message || 'Action impossible.' });
    }
  }

  const filieres = [...new Map(classes.filter((c) => c.filiere).map((c) => [c.filiere.code, c.filiere])).values()];
  const shown = filtreFiliere ? classes.filter((c) => c.filiere?.code === filtreFiliere) : classes;
  const pg = usePagination(shown, 10);

  if (loading) return <div className="empty">Chargement…</div>;

  if (err) {
    return (
      <div>
        <div className="page-title">Centre de contrôle</div>
        <div className="card" style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>
          <b>Impossible de charger les classes.</b>
          <div style={{ marginTop: 6 }}>{err}</div>
          <div className="muted" style={{ marginTop: 10 }}>
            Si le message évoque une colonne « niveau_id » manquante, la base n'est pas à jour :
            relance le backend après <b>php artisan migrate:fresh --seed</b>.
          </div>
          <button className="btn btn-red mt" onClick={load}>Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">Centre de contrôle</div>
      <p className="muted">
        Attribuez les droits de publication : désignez ou révoquez le délégué de chaque classe
        (un délégué est propre à une classe = un niveau d'une filière).
      </p>

      <div className="row" style={{ marginBottom: 14 }}>
        <label className="field" style={{ margin: 0 }}>Filtrer par filière :</label>
        <select className="input" style={{ maxWidth: 240 }} value={filtreFiliere}
                onChange={(e) => setFiltreFiliere(e.target.value)}>
          <option value="">Toutes</option>
          {filieres.map((f) => <option key={f.code} value={f.code}>{f.code} — {f.nom}</option>)}
        </select>
      </div>

      {msg && (
        <div style={{ marginBottom: 12, color: msg.type === 'ok' ? 'var(--success)' : 'var(--red)' }}>{msg.text}</div>
      )}

      <table className="tbl">
        <thead>
          <tr><th>Classe</th><th>Délégué actuel</th><th>Désigner un délégué</th><th>Élèves</th></tr>
        </thead>
        <tbody>
          {pg.pageItems.map((c) => {
            const current = c.delegues?.[0];
            // Uniquement les élèves de CETTE classe (même niveau).
            const elevesClasse = candidats.filter((u) => String(u.niveau_id) === String(c.niveau_id));
            const isOpen = !!open[c.niveau_id];
            return (
              <React.Fragment key={c.niveau_id}>
                <tr>
                  <td>
                    {c.filiere && <Badge code={c.filiere.code} couleur={c.filiere.couleur} />}{' '}
                    <b>{c.filiere?.code} · {c.niveau}</b>
                  </td>
                  <td>
                    {current ? (
                      <span className="row" style={{ gap: 8 }}>
                        <span>{current.name}</span>
                        <button className="btn btn-danger" onClick={() => revoke(c.niveau_id, current.id)}>Révoquer</button>
                      </span>
                    ) : <span className="muted">Aucun délégué</span>}
                  </td>
                  <td>
                    <span className="row" style={{ gap: 8 }}>
                      <select className="input" style={{ maxWidth: 260 }}
                              value={picks[c.niveau_id] || ''}
                              onChange={(e) => setPicks((p) => ({ ...p, [c.niveau_id]: e.target.value }))}>
                        <option value="">
                          {elevesClasse.length ? `Choisir parmi ${elevesClasse.length} élève(s)…` : 'Aucun élève dans cette classe'}
                        </option>
                        {elevesClasse.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}{u.role === 'delegue' ? ' (délégué actuel)' : ''}
                          </option>
                        ))}
                      </select>
                      <button className="btn btn-red" disabled={!elevesClasse.length}
                              onClick={() => designate(c.niveau_id)}>Désigner</button>
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost"
                            onClick={() => setOpen((o) => ({ ...o, [c.niveau_id]: !o[c.niveau_id] }))}>
                      {isOpen ? 'Masquer' : `Voir (${elevesClasse.length})`}
                    </button>
                  </td>
                </tr>

                {isOpen && (
                  <tr>
                    <td colSpan={4} style={{ background: '#F7F7F7' }}>
                      {elevesClasse.length === 0 ? (
                        <span className="muted">Aucun élève dans cette classe.</span>
                      ) : (
                        <div>
                          <div className="spread" style={{ marginBottom: 8, alignItems: 'center' }}>
                            <span className="muted">Élèves de la classe :</span>
                            <button className="btn btn-danger"
                                    onClick={() => clearClass(c.niveau_id, `${c.filiere?.code} · ${c.niveau}`, elevesClasse.length)}>
                              🗑 Vider la classe ({elevesClasse.length})
                            </button>
                          </div>
                          {elevesClasse.map((u) => (
                            <div key={u.id} className="spread"
                                 style={{ padding: '7px 4px', borderBottom: '1px solid #E6E6E6' }}>
                              <span>
                                {u.name} <span className="muted">({u.email})</span>
                                {u.role === 'delegue' ? <b style={{ color: 'var(--red)' }}> — délégué</b> : ''}
                              </span>
                              <button className="btn btn-danger"
                                      onClick={() => deleteEleve(u.id, u.name)}>Supprimer</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      <Pagination {...pg} />
    </div>
  );
}
