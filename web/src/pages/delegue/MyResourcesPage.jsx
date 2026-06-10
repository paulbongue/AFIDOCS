import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import ResourceListItem from '../../components/ResourceListItem';

export default function MyResourcesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await client.get('/ressources');
    setMine((data.data || []).filter((r) => r.user_id === user?.id));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function remove(id) {
    if (!confirm('Supprimer cette ressource ?')) return;
    await client.delete(`/ressources/${id}`);
    await load();
  }

  return (
    <div>
      <div className="spread">
        <div className="page-title">Mes ressources</div>
        <button className="btn btn-red" onClick={() => navigate('/delegue/publier')}>⬆ Publier</button>
      </div>

      <div className="mt">
        {loading ? <div className="empty">Chargement…</div>
          : mine.length === 0 ? <div className="empty">Vous n'avez publié aucune ressource.</div>
          : mine.map((r) => (
            <ResourceListItem key={r.id} ressource={r}
              onOpen={() => navigate(`/delegue/ressources/${r.id}`)}
              actions={<button className="btn btn-danger" onClick={() => remove(r.id)}>Supprimer</button>} />
          ))}
      </div>
    </div>
  );
}
