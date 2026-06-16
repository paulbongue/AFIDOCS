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
          <TouchableOpacity style={styles.markAll} onPress={markAll} activeOpacity={0.7}>
            <Icon name="check-all" size={16} color={colors.brand} />
            <Text style={styles.link}>Tout marquer lu</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          const cat = categoryOf(item.data);
          return (
            <View style={styles.item}>
              <View style={[styles.iconCircle, { backgroundColor: cat.bg }]}>
                <Icon name={cat.icon} size={18} color={cat.color} />
              </View>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => open(item)} activeOpacity={0.7}>
                <View style={styles.titleRow}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{cat.label}</Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.msg} numberOfLines={2}>{item.data?.message || 'Notification'}</Text>
                <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.delBtn} onPress={() => remove(item)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close" size={16} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyCircle}><Icon name="bell" size={30} color={colors.textMuted} /></View>
            <Text style={styles.emptyText}>Aucune notification pour le moment.</Text>
          </View>
        }
        contentContainerStyle={[{ paddingBottom: 16 }, items.length === 0 && styles.grow]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  grow: { flexGrow: 1 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 10 },
  kicker: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.5 },
  title: { fontSize: 22, fontWeight: '900', color: colors.text, marginTop: 1 },
  markAll: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  link: { color: colors.brand, fontWeight: '700', fontSize: 13 },
  item: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: 14,
    marginHorizontal: 14, marginVertical: 5, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemTitle: { color: colors.text, fontWeight: '800', fontSize: 14, flexShrink: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand },
  msg: { color: colors.textMuted, fontSize: 13, marginTop: 2, lineHeight: 18 },
  time: { color: colors.textLight, fontSize: 11, marginTop: 5 },
  delBtn: { padding: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyText: { color: colors.textMuted },
});
