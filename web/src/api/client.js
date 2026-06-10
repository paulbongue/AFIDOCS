import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const TOKEN_KEY = 'afi_web_token';

const client = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json' },
  withCredentials: false,
});

// Injecte le token Sanctum stocké dans le localStorage.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
