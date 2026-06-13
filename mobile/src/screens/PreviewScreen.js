import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, Image, ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Sharing from 'expo-sharing';
import { colors } from '../theme';

// Visionneuse intégrée (rendu DIRECT dans l'app, sans service externe).
// - Images : composant Image natif.
// - Autres documents : WebView sur le fichier (local s'il est téléchargé, sinon
//   l'URL en ligne).
export default function PreviewScreen({ route }) {
  const p = route.params || {};
  const { type, titre } = p;
  // On privilégie le fichier local (hors-ligne) puis l'URL distante.
  const url = p.localUri || p.remoteUrl || p.url || null;
  const isImage = type === 'image';
  const isRemote = /^https?:/i.test(url || '');

  async function openExternally() {
    if (!url) return;
    try {
      if (isRemote) {
        await Linking.openURL(url);
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(url);
      }
    } catch (_) { /* ignore */ }
  }

  return (
    <View style={styles.flex}>
      {!url ? (
        <View style={styles.center}><Text style={styles.muted}>Fichier indisponible.</Text></View>
      ) : isImage ? (
        <Image source={{ uri: url }} style={styles.img} resizeMode="contain" />
      ) : (
        <WebView
          source={{ uri: url }}
          style={{ flex: 1, backgroundColor: '#fff' }}
          originWhitelist={['*']}
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>
          )}
        />
      )}

      <TouchableOpacity style={styles.ext} onPress={openExternally}>
        <Text style={styles.extText}>Ouvrir avec une autre application</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: 28 },
  img: { flex: 1, width: '100%', backgroundColor: '#000' },
  muted: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  ext: { backgroundColor: colors.navy, padding: 14, alignItems: 'center' },
  extText: { color: '#fff', fontWeight: '700' },
});
