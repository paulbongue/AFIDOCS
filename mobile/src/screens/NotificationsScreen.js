import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import OfflineBanner from '../components/OfflineBanner';
import Icon from '../components/Icon';
import client from '../api/client';
import { useNotifications } from '../context/NotificationsContext';
import { colors, radius, shadow } from '../theme';

// Catégorie visuelle (icône + couleur) déduite des données de la notification.
function categoryOf(data) {
  const d = data || {};
  if (d.kind === 'emploi' || d.link === 'emploi') {
    return { icon: 'calendar', color: colors.fileDocx, bg: '#E7E9FB', label: 'Emploi du temps' };
  }
  if (d.link === 'classe' || d.message_id) {
    return { icon: 'chat', color: colors.filePdf, bg: '#F0E8FC', label: 'Message de classe' };
  }
  if (d.link === 'annonces' || d.post_id) {
    return { icon: 'megaphone', color: colors.notif, bg: '#FDEBDD', label: 'Annonce' };
  }
  if (d.ressource_id) {
    return { icon: 'file', color: colors.download, bg: '#E3F4E7', label: 'Nouvelle ressource' };
  }
  if (d.kind === 'membre' || d.new_user_id) {
    return { icon: 'user-plus', color: colors.success, bg: '#E3F4E7', label: 'Nouveau membre' };
  }
  return { icon: 'bell', color: colors.textMuted, bg: colors.muted, label: 'Notification' };
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

export default function NotificationsScreen({ navigation }) {
  const { refresh } = useNotifications();
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get('/notifications');
      setItems(data.data || []);
      refresh();
    } catch (_) { /* hors-ligne */ }
  }, [refresh]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function open(n) {
    if (!n.read) { try { await client.post(`/notifications/${n.id}/read`); } catch (_) {} }
    await load();
    if (n.data?.ressource_id) {
      navigation.navigate('Ressources', {
        screen: 'RessourceDetail',
        params: { id: n.data.ressource_id, titre: n.data.titre },
      });
    } else if (n.data?.link === 'annonces') {
      navigation.navigate('Échanges', {
        screen: 'EchangesHome',
        params: { tab: 'annonces', focusPost: n.data.post_id, ts: Date.now() },
      });
    } else if (n.data?.link === 'classe') {
      navigation.navigate('Échanges', {
        screen: 'EchangesHome',
        params: { tab: 'classe', focusMsg: n.data.message_id, ts: Date.now() },
      });
    }
  }

  async function markAll() {
    try { await client.post('/notifications/read-all'); } catch (_) {}
    await load();
  }

  async function remove(n) {
    try { await client.delete(`/notifications/${n.id}`); } catch (_) {}
    await load();
  }

  const hasUnread = items.some((i) => !i.read);

  return (
    <View style={styles.flex}>
      <OfflineBanner />
      <View style={styles.head}>
        <View>
          <Text style={styles.kicker}>ACTIVITÉ</Text>
          <Text style={styles.title}>Notifications</Text>
        </View>
        {hasUnread && (
          <TouchableOpacity style={styles.markAll} onPress={markAll} activeOpacity={0.7}