import Constants from 'expo-constants';
import { Alert, Linking } from 'react-native';
import client from '../api/client';

// Compare deux numéros de version "x.y.z". Retourne true si `latest` est plus
// récente que `current`.
function isNewer(current, latest) {
  const pa = String(current).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(latest).split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const a = pa[i] || 0;
    const b = pb[i] || 0;
    if (b > a) return true;
    if (b < a) return false;
  }
  return false;
}

let alreadyChecked = false;

// Vérifie auprès du serveur si une version plus récente de l'application est
// disponible et, le cas échéant, propose son téléchargement.
// Tolérant aux erreurs (hors-ligne, endpoint indisponible) : ne bloque jamais l'app.
export async function checkForUpdate({ force = false } = {}) {
  if (alreadyChecked && !force) return;
  alreadyChecked = true;
  try {
    const current =
      Constants?.expoConfig?.version ||
      Constants?.manifest?.version ||
      '0.0.0';

    const { data } = await client.get('/app-version');
    if (!data?.version || !isNewer(current, data.version)) return;

    const url = data.url;
    const notes = data.notes ? `\n\n${data.notes}` : '';
    const buttons = [
      { text: 'Télécharger', onPress: () => url && Linking.openURL(url) },
    ];
    if (!data.mandatory) {
      buttons.unshift({ text: 'Plus tard', style: 'cancel' });
    }

    Alert.alert(
      'Mise à jour disponible',
      `Une nouvelle version (${data.version}) de AFI-DOCS est disponible.${notes}`,
      buttons,
      { cancelable: !data.mandatory },
    );
  } catch (_) {
    // silencieux : pas de réseau ou endpoint indisponible
  }
}
