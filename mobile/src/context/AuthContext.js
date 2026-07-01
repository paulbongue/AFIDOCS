import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client, { TOKEN_KEY, setAuthToken } from '../api/client';
import { registerForPushAndSync, clearPushToken } from '../services/notifications';

const USER_KEY = '@afi_user';
const DEVICE_KEY = '@afi_device_token';
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

  // Ouvre réellement la session à partir de la réponse serveur { token, user }.
  async function finalizeSession(data) {
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
    registerForPushAndSync(); // enregistre le jeton push (fire and forget)
  }

  // Étape 1 — identifiants. Renvoie { otpRequired } ou { otpRequired:false, user }.
  async function login(email, password) {
    const device_token = (await AsyncStorage.getItem(DEVICE_KEY)) || undefined;
    const { data } = await client.post('/login', {
      email,
      password,
      device_name: 'expo-mobile',
      device_token,
    });

    if (data.otp_required) {
      return { otpRequired: true, maskedEmail: data.email };
    }

    await finalizeSession(data);
    return { otpRequired: false, user: data.user };
  }

  // Étape 2 — vérification du code reçu par e-mail.
  async function verifyOtp(email, code, rememberDevice) {
    const { data } = await client.post('/login/otp', {
      email,
      code,
      device_name: 'expo-mobile',
      remember_device: !!rememberDevice,
    });
    if (data.device_token) await AsyncStorage.setItem(DEVICE_KEY, data.device_token);
    await finalizeSession(data);
    return data.user;
  }

  async function resendOtp(email) {
    await client.post('/login/otp/resend', { email });
  }

  // Met à jour le profil en mémoire (ex. après confirmation de l'e-mail de sécurité).
  async function updateUser(u) {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
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
    <AuthContext.Provider value={{ user, token, loading, login, verifyOtp, resendOtp, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
