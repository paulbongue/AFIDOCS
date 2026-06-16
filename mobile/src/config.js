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

// Interrupteur pratique : en DÉV (Expo Go), utiliser directement le serveur en
// ligne au lieu d'un backend local. Pratique pour tester l'UI sans lancer XAMPP.
//   true  -> Expo Go tape sur afidocs.duckdns.org (rien à lancer en local)
//   false -> Expo Go tape sur le backend local du PC (php artisan serve)
// N'affecte QUE le dev : l'APK autonome utilise toujours la production.
const USE_PROD_IN_DEV = true;

const FALLBACK_IP = '192.168.1.10';
const API_PORT = 8000;

// Hôte du serveur Expo, ex : "192.168.34.253:8081" -> on garde "192.168.34.253".
function inferHost() {
  const candidates = [
    Constants?.expoConfig?.hostUri,
    Constants?.expoGoConfig?.debuggerHost,
    Const