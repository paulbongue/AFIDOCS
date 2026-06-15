import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import OfflineBanner from '../components/OfflineBanner';
import client from '../api/client';
import { useNotifications } from '../context/NotificationsContext';
import { colors, radius } from '../theme';

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
        <Text style={styles.title}>Notifications</Text>
        {hasUnread && (
          <TouchableOpacity onPress={markAll}><Text style={styles.link}>Tout marquer lu</Text></TouchableOpacity>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={[styles.item, !item.read && styles.unread]}>
            <Text style={styles.dot}>{item.read ? '' : '●'}</Text>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => open(item)} activeOpacity={0.7}>
              <Text style={styles.msg}>{item.data?.message || 'Notification'}</Text>
              {item.data?.matiere ? <Text style={styles.sub}>{item.data.matiere}</Text> : null}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => remove(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.del}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>Aucune notification pour le moment.</Text>
          </View>
        }
        contentContainerStyle={items.length === 0 && styles.grow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  grow: { flexGrow: 1 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: '900', color: colors.navy },
  link: { color: colors.red, fontWeight: '700' },
  item: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: colors.surface, borderRadius: radius.md, padding: 14,
    marginHorizontal: 14, marginVertical: 5, borderWidth: 1, borderColor: colors.border,
  },
  unread: { backgroundColor: '#FCEEEA', borderColor: '#F1C9BD' },
  dot: { color: colors.red, fontSize: 12, width: 12 },
  del: { color: colors.textLight, fontSize: 16, paddingHorizontal: 4, paddingTop: 2 },
  msg: { color: colors.navy, fontWeight: '700', fontSize: 14 },
  sub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 44, marginBottom: 10 },
  emptyText: { color: colors.textMuted },
});
