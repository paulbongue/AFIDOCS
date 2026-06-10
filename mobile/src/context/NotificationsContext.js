import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import client from '../api/client';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext({ unread: 0, refresh: () => {} });

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) { setUnread(0); return; }
    try {
      const { data } = await client.get('/notifications');
      setUnread(data.unread || 0);
    } catch (_) { /* silencieux (hors-ligne) */ }
  }, [user]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    // Rafraîchit aussi le compteur dès qu'un push arrive (app au premier plan).
    let sub;
    try { sub = Notifications.addNotificationReceivedListener(() => refresh()); } catch (_) {}
    return () => { clearInterval(t); sub?.remove?.(); };
  }, [refresh]);

  return (
    <NotificationsContext.Provider value={{ unread, refresh }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
