// ---------------------------------------------------------------------------
// Configuration de l'API — détection AUTOMATIQUE de l'adresse du serveur.
// ---------------------------------------------------------------------------
// L'app déduit l'IP de ton PC à partir du serveur de dev Expo (Metro). Ainsi,
// quand ton IP change (changement de Wi-Fi, partage de connexion…), l'API suit
// automatiquement — plus besoin d'éditer ce fichier.
//
// Le backend doit écouter sur le réseau :  php artisan serve --host=0.0.0.0
// (c'est ce que fait demarrer_backend.bat).
//
// Si jamais la détection échoue, remplace FALLBACK_IP par l'IPv4 de ton PC
// (Windows -> `ipconfig` -> « Adresse IPv4 »).
// ---------------------------------------------------------------------------

import Constants from 'expo-constants';

// Serveur de PRODUCTION : utilisé par l'APK autonome (qui n'a pas de Metro pour
// déduire l'IP du PC). En dev (Expo Go), on garde la détection automatique.
const PROD_API_URL = 'https://afidocs.duckdns.org/api';

const FALLBACK_IP = '192.168.1.10';
const API_PORT = 8000;

// Hôte du serveur Expo, ex : "192.168.34.253:8081" -> on garde "192.168.34.253".
function inferHost() {
  const candidates = [
    Constants?.expoConfig?.hostUri,
    Constants?.expoGoConfig?.debuggerHost,
    Constants?.manifest?.debuggerHost,
    Constants?.manifest?.hostUri,
    Constants?.manifest2?.extra?.expoClient?.hostUri,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length) {
      const host = c.split(':')[0];
      // On ignore localhost (cas du navigateur) au profit du fallback réseau.
      if (host && host !== 'localhost' && host !== '127.0.0.1') return host;
    }
  }
  return null;
}

const host = inferHost();

// Dev (Metro détecté) -> serveur local du PC ; sinon (APK autonome) -> production.
export const API_URL = host
  ? `http://${host}:${API_PORT}/api`
  : (__DEV__ ? `http://${FALLBACK_IP}:${API_PORT}/api` : PROD_API_URL);

// Durée (ms) au-delà de laquelle une requête est considérée en échec.
export const REQUEST_TIMEOUT = 10000;
