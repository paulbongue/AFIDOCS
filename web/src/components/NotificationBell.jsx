import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

// Cloche de notifications : compteur de non-lus + liste déroulante.
export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get('/notifications');
      setItems(data.data || []);
      setUnread(data.unread || 0);
    } catch (_) { /* silencieux */ }
  }, []);

  // Chargement initial + rafraîchissement périodique (15 s) + au retour sur l'onglet.
  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [load]);

  // Fermer le panneau au clic extérieur.
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const base = user?.role === 'admin' ? '/admin' : user?.role === 'delegue' ? '/delegue' : '/etudiant';

  async function openNotif(n) {
    setOpen(false);
    if (!n.read) { try { await client.post(`/notifications/${n.id}/read`); } catch (_) {} }
    if (n.data?.ressource_id) navigate(`${base}/ressources/${n.data.ressource_id}`);
    else if (n.data?.link === 'annonces') navigate(`${base}/annonces${n.data.post_id ? `?post=${n.data.post_id}` : ''}`);
    else if (n.data?.link === 'classe') navigate(`${base}/classe${n.data.message_id ? `?msg=${n.data.message_id}` : ''}`);
    else if (n.data?.link) navigate(`${base}/${n.data.link}`);
    load();
  }

  async function markAll() {
    try { await client.post('/notifications/read-all'); } catch (_) {}
    load();
  }

  async function deleteNotif(id) {
    try { await client.delete(`/notifications/${id}`); } catch (_) {}
    load();
  }

  return (
    <div className="bell" ref={ref}>
      <button className="bell-btn" onClick={() => setOpen((o) => !o)} title="Notifications">
        🔔{unread > 0 && <span className="bell-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="bell-panel">
          <div className="bell-head">
            <b>Notifications</b>
            {unread > 0 && <button className="bell-link" onClick={markAll}>Tout marquer lu</button>}
          </div>
          {items.length === 0 ? (
 