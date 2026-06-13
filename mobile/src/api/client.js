import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, REQUEST_TIMEOUT } from '../config';

export const TOKEN_KEY = '@afi_token';

// Instance Axios partagee. Le token Sanctum est injecte automatiquement.
const client = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    Accept: 'application/json',
    // X-Platform : origine des actions pour le suivi d'activité (web | mobile).
    'X-Platform': 'mobile',
  },
});

let inMemoryToken = null;

export function setAuthToken(token) {
  inMemoryToken = token;
}

// Enregistre une action (consultation/aperçu ou téléchargement) sans bloquer l'UI.
// Sans effet hors-ligne (l'appel échoue silencieusement).
export function recordActivity(type, ressourceId) {
  client.post('/activites', { type, ressource_id: ressourceId }).catch(() => {});
}

client.interceptors.request.use(async (config) => {
  if (!inMemoryToken) {
    inMemoryToken = await AsyncStorage.getItem(TOKEN_KEY);
  }
  if (inMemoryToken) {
    config.headers.Authorization = `Bearer ${inMemoryToken}`;
  }
  return config;
});

export default client;
