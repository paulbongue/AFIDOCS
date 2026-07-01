import React, { createContext, useContext, useEffect, useState } from 'react';
import client, { TOKEN_KEY } from '../api/client';

const USER_KEY = 'afi_web_user';
const DEVICE_KEY = 'afi_web_device_token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const stored = localStorage.getItem(USER_KEY);
    if (stored) setUser(JSON.parse(stored));
    // Revalide le profil si un token existe.
    if (token) {
      client.get('/me')
        .then(({ data }) => {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Étape 1 — identifiants. Renvoie soit une session, soit une demande d'OTP.
  async function login(email, password) {
    const device_token = localStorage.getItem(DEVICE_KEY) || undefined;
    const { data } = await client.post('/login', {
      email, password, device_name: 'web', device_token,
    });

    // Double authentification requise : on ne connecte pas encore.
    if (data.otp_required) {
      return { otpRequired: true, maskedEmail: data.email };
    }

    finalizeSession(data);
    return { otpRequired: false, user: data.user };
  }

  // Étape 2 — vérification du code reçu par e-mail.
  async function verifyOtp(email, code, rememberDevice) {
    const { data } = await client.post('/login/otp', {
      email, code, device_name: 'web', remember_device: !!rememberDevice,
    });
    if (data.device_token) localStorage.setItem(DEVICE_KEY, data.device_token);
    finalizeSession(data);
    return data.user;
  }

  async function resendOtp(email) {
    await client.post('/login/otp/resend', { email });
  }

  function finalizeSession(data) {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  }

  async function logout() {
    try { await client.post('/logout'); } catch (_) { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyOtp, resendOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
