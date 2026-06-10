import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import client from '../api/client';

// Affiche les notifications reçues au premier plan.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Demande la permission, récupère le jeton Expo et l'envoie au backend.
// Tolérant aux erreurs : ne casse jamais le flux de connexion.
export async function registerForPushAndSync() {
  try {
    if (!Device.isDevice) return null; // pas de push sur émulateur

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const tokenResp = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenResp?.data;

    if (token) {
      try { await client.post('/me/push-token', { token }); } catch (_) { /* ignore */ }
    }
    return token;
  } catch (_) {
    return null;
  }
}

// Efface le jeton côté serveur (à la déconnexion).
export async function clearPushToken() {
  try { await client.post('/me/push-token', { token: null }); } catch (_) { /* ignore */ }
}
