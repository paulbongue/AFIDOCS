import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

import { AuthProvider } from './src/context/AuthContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { initDatabase } from './src/db/database';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme';

// Référence de navigation globale pour ouvrir le bon écran au tap d'un push.
export const navigationRef = createNavigationContainerRef();

// Ouvre l'écran ciblé à partir des données d'une notification (push ou tap).
// Même logique que l'ouverture in-app (écran Notifications).
function navigateFromData(data) {
  if (!data || !navigationRef.isReady()) return;
  if (data.ressource_id) {
    navigationRef.navigate('Ressources', {
      screen: 'RessourceDetail',
      params: { id: data.ressource_id, titre: data.titre },
    });
  } else if (data.link === 'annonces') {
    navigationRef.navigate('Échanges', {
      screen: 'EchangesHome',
      params: { tab: 'annonces', focusPost: data.post_id, ts: Date.now() },
    });
  } else if (data.link === 'classe') {
    navigationRef.navigate('Échanges', {
      screen: 'EchangesHome',
      params: { tab: 'classe', focusMsg: data.message_id, ts: Date.now() },
    });
  } else {
    navigationRef.navigate('Notifs');
  }
}

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase().then(() => setDbReady(true)).catch((e) => {
      console.error('Erreur init DB locale', e);
      setDbReady(true); // on laisse l'app demarrer malgre tout
    });
  }, []);

  // Tap sur un push : navigue vers l'écran concerné (app en arrière-plan ou tuée).
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      navigateFromData(resp?.notification?.request?.content?.data);
    });
    // Démarrage à froid (app ouverte depuis une notification) : on attend que la
    // navigation soit prête avant de rediriger.
    Notifications.getLastNotificationResponseAsync().then((resp) => {
      if (resp) setTimeout(() => navigateFromData(resp.notification.request.content.data), 800);
    }).catch(() => {});
    return () => sub.remove();
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.red} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <AuthProvider>
          <NotificationsProvider>
            <NavigationContainer ref={navigationRef}>
              <RootNavigator />
            </NavigationContainer>
            <StatusBar style="light" />
          </NotificationsProvider>
        </AuthProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
