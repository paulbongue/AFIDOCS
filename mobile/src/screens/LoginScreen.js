import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import { colors, radius } from '../theme';
import { AfiBadge, Wordmark } from '../components/Logo';

export default function LoginScreen() {
  const { login } = useAuth();
  const { isOnline } = useNetwork();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Champs requis', 'Renseigne ton identifiant et ton mot de passe.');
      return;
    }
    if (!isOnline) {
      Alert.alert('Hors-ligne', 'Une connexion internet est nécessaire pour la première connexion.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e) {
      const msg = e?.response?.data?.message
        || e?.response?.data?.errors?.email?.[0]
        || "Connexion impossible. Vérifie tes identifiants et l'adresse du serveur.";
      Alert.alert('Échec de connexion', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brandTop}>
          <AfiBadge light />
        </View>

        <Wordmark color="#fff" size={40} />
        <Text style={styles.tagline}>Votre Documentation pour un meilleur apprentissage.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Identifiant</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="prenom.nom@afi.sn"
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textLight}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Se connecter</Text>}
          </TouchableOpacity>

          {!isOnline && (
            <Text style={styles.offline}>● Hors-ligne — connexion internet requise pour s'identifier</Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.navy },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brandTop: { marginBottom: 36 },
  tagline: { fontSize: 15, fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', marginTop: 10, marginBottom: 30 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20 },
  label: { fontSize: 13, fontWeight: '700', color: colors.navy, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: colors.red, borderRadius: radius.sm, paddingVertical: 14,
    alignItems: 'center', marginTop: 22,
  },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  offline: { color: colors.red, fontSize: 12, textAlign: 'center', marginTop: 12 },
  hint: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center', marginTop: 24, lineHeight: 18 },
});
