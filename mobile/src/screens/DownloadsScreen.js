import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';

import OfflineBanner from '../components/OfflineBanner';
import ResourceCard from '../components/ResourceCard';
import StatCard from '../components/StatCard';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import * as dbApi from '../db/database';
import { removeDownload, reachableFileUrl } from '../services/sync';
import { colors, formatSize } from '../theme';

export default function DownloadsScreen({ navigation }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    setItems(await dbApi.getDownloaded(user?.id));
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function preview(item) {
    if (!item.local_uri) return;
    navigation.navigate('Ressources', {
      screen: 'RessourcePreview',
      params: {
        remoteUrl: item.url_fichier ? reachableFileUrl(item.url_fichier) : null,
        localUri: item.local_uri,
        type: item.type_fichier,
        titre: item.titre,
      },
    });
  }

  async function saveToDevice(item) {
    if (!item.local_uri) return;
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Indisponible', "Enregistrement non disponible sur cet appareil.");
      return;
    }
    await Sharing.shareAsync(item.local_uri);
  }

  function confirmRemove(item) {
    Alert.alert('Libérer de l\'espace', `Supprimer « ${item.titre} » de cet appareil ?\nLa ressource reste disponible et re-téléchargeable.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try { await removeDownload(user?.id, item); await load(); }
          catch (_) { Alert.alert('Erreur', 'Suppression impossible.'); }
        },
      },
    ]);
  }

  const totalSize = items.reduce((s, i) => s + (i.taille_fichier || 0), 0);

  const header = (
    <View>
      <Text style={styles.kicker}>TÉLÉCHARGEMENTS</Text>
      <Text style={styles.title}>Disponibles hors-ligne</Text>
      <View style={styles.statsRow}>
        <StatCard value={items.length} label="Fichiers stockés"
                  icon={<Icon name="folder-down" size={18} color={colors.download} />} tintBg="#E3F4E7" />
        <StatCard value={formatSize(totalSize) || '0 o'} label="Espace utilisé"
                  icon={<Icon name="inbox" size={18} color={colors.filePdf} />} tintBg="#F0E8FC" />
      </View>
    </View>
  );

  return (
    <View style={styles.flex}>
      <OfflineBanner />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <ResourceCard ressource={item} onPress={() => preview(item)} />
            </View>
            <TouchableOpacity style={styles.act} onPress={() => saveToDevice(item)} accessibilityLabel="Enregistrer sur l'appareil">
              <Icon name="folder-down" size={17} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.act} onPress={() => confirmRemove(item)} accessibilityLabel="Supprimer de l'appareil">
              <Icon name="trash" size={17} color={colors.brand} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyCircle}><Icon name="folder-down" size={34} color={colors.download} /></View>
            <Text style={styles.emptyTitle}>Aucun fichier hors-ligne</Text>
            <Text style={styles.emptyText}>
              Ouvre une ressource et appuie sur « Télécharger pour hors-ligne » pour la consulter sans connexion.
            </Text>
          </View>
        }
        contentContainerStyle={[{ paddingBottom: 20 }, items.length === 0 && styles.grow]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  grow: { flexGrow: 1 },
  kicker: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.5, paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 22, fontWeight: '900', color: colors.text, paddingHorizontal: 16, marginTop: 1, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, marginBottom: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyCircle: { width: 86, height: 86, borderRadius: 43, backgroundColor: '#E3F4E7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { color: colors.text, fontWeight: '800', fontSize: 16, marginBottom: 6 },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingRight: 14, gap: 6 },
  act: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
});
