import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../theme';

// Visionneuse intégrée : image native pour les images, WebView pour le reste
// (PDF rendu en in-app sur iOS ; sur Android le PDF peut nécessiter le navigateur).
export default function PreviewScreen({ route }) {
  const { url, type, titre } = route.params || {};
  const isImage = type === 'image';

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
          startInLoadingState
          renderLoading={() => (
            <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>
          )}
        />
      )}

      <TouchableOpacity style={styles.ext} onPress={() => url && Linking.openURL(url)}>
        <Text style={styles.extText}>Ouvrir dans le navigateur</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  img: { flex: 1, width: '100%', backgroundColor: '#000' },
  muted: { color: colors.textMuted },
  ext: { backgroundColor: colors.navy, padding: 14, alignItems: 'center' },
  extText: { color: '#fff', fontWeight: '700' },
});
