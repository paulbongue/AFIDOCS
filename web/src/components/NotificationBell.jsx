import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { IconBell, IconChat, IconMegaphone, IconBook, IconUsers, IconPin } from './Icons';

// Catégorie visuelle (icône + couleur) déduite des données de la notification.
function categoryOf(data) {
  const d = data || {};
  if (d.kind === 'emploi' || d.link === 'emploi')
    return { Icon: IconPin, color: 'var(--docx)', bg: '#E7E9FB', label: 'Emploi du temps' };
  if (d.link === 'classe' || d.message_id)
    return { Icon: IconChat, color: 'var(--pdf)', bg: '#F0E8FC', label: 'Message de classe' };
  if (d.link === 'annonces' || d.post_id)
    return { Icon: IconMegaphone, color: 'var(--notif)', bg: '#FDEBDD', label: 'Annonce' };
  if (d.ressource_id)
    return { Icon: IconBook, color: 'var(--download)', bg: 'var(--success-bg)', label: 'Nouvelle ressource' };
  if (d.kind === 'membre' || d.new_user_id)
    return { Icon: IconUsers, color: 'var(--download)', bg: 'var(--success-bg)', label: 'Nouveau membre' };
  return { Icon: IconBell, color: 'var(--muted)', bg: '#EEF1F4', label: 'Notification' };
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  const days = Math.floor(diff / 86400);
  if (days < 7) return `il y a ${days} j`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

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
        <IconBell size={20} />
        {unread > 0 && <span className="bell-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="bell-panel">
          <div className="bell-head">
            <b>Notifications</b>
            {unread > 0 && <button className="bell-link" onClick={markAll}>Tout marquer lu</button>}
          </div>
          {items.length === 0 ? (
            <div className="bell-empty">Aucune notification.</div>
          ) : items.map((n) => {
            const cat = categoryOf(n.data);
            return (
              <div key={n.id} className={'bell-item' + (n.read ? '' : ' unread')}>
                <div className="bell-ico" style={{ background: cat.bg, color: cat.color }}>
                  <cat.Icon size={16} />
                </div>
                <div className="bell-item-main" onClick={() => openNotif(n)}>
                  <div className="bell-item-head">
                    <span className="bell-item-title">{cat.label}</span>
                    {!n.read && <span className="bell-dot" />}
                  </div>
                  <div className="bell-msg">{n.data?.message || 'Notification'}</div>
                  <div className="bell-time">{timeAgo(n.created_at)}</div>
                </div>
                <button className="bell-del" title="Supprimer"
                        onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}>✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
