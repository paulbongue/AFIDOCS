import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client, { TOKEN_KEY, setAuthToken } from '../api/client';
import { registerForPushAndSync, clearPushToken } from '../services/notifications';

const USER_KEY = '@afi_user';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restauration de la session au demarrage (permet l'usage hors-ligne immediat).
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);
        if (storedToken) {
          setAuthToken(storedToken);
          setToken(storedToken);
        }
        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedToken) registerForPushAndSync(); // (ré)enregistre le push
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email, password) {
    const { data } = await client.post('/login', {
      email,
      password,
      device_name: 'expo-mobile',
    });
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
    registerForPushAndSync(); // enregistre le jeton push (fire and forget)
    return data.user;
  }

  async function logout() {
    try {
      await clearPushToken();      // retire le jeton push côté serveur
      await client.post('/logout'); // best-effort ; ignore si hors-ligne
    } catch (_) { /* ignore */ }
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
