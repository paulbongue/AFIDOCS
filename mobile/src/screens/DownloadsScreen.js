import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';

import OfflineBanner from '../components/OfflineBanner';
import ResourceCard from '../components/ResourceCard';
import { useAuth } from '../context/AuthContext';
import * as dbApi from '../db/database';
import { colors, formatSize } from '../theme';

export default function DownloadsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    setItems(await dbApi.getDownloaded(user?.id));
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function open(item) {
    if (!item.local_uri) return;
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Indisponible', "Ouverture de fichier non disponible.");
      return;
    }
    await Sharing.shareAsync(item.local_uri);
  }

  const totalSize = items.reduce((s, i) => s + (i.taille_fichier || 0), 0);

  return (
    <View style={styles.flex}>
      <OfflineBanner />
      <View style={styles.head}>
        <Text style={styles.title}>Disponibles hors-ligne</Text>
        <Text style={styles.sub}>{items.length} fichier(s) · {formatSize(totalSize)}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ResourceCard ressource={item} onPress={() => open(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📥</Text>
            <Text style={styles.emptyText}>
              Aucun fichier hors-ligne.{'\n'}
              Ouvre une ressource et appuie sur « Telecharger pour hors-ligne ».
            </Text>
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
  head: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  tip: { color: colors.textMuted, fontSize: 11, textAlign: 'center', padding: 8 },
});
