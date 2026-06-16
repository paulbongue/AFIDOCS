import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const TOKEN_KEY = 'afi_web_token';

const client = axios.create({
  baseURL: API_URL,
  // X-Platform : origine des actions pour le suivi d'activité (web | mobile).
  headers: { Accept: 'application/json', 'X-Platform': 'web' },
  withCredentials: false,
});

// Enregistre une action (consultation/aperçu ou téléchargement) sans bloquer l'UI.
export function recordActivity(type, ressourceId) {
  client.post('/activ