import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import { colors, radius } from '../theme';
import { AfiBadge, Wordmark } from '../components/Logo';
import Icon from '../components/Icon';

export default function LoginScreen() {
  const { login, verifyOtp, resendOtp } = useAuth();
  const { isOnline } = useNetwork();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Étape OTP (double authentification par e-mail).
  const [step, setStep] = useState('creds'); // 'creds' | 'otp'
  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(true);
  const [maskedEmail, setMaskedEmail] = useState('');

  function errMsg(e, fallback) {
    return e?.response?.data?.errors?.code?.[0]
      || e?.response?.data?.message
      || e?.response?.data?.errors?.email?.[0]
      || fallback;
  }

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
      const res = await login(email.trim().toLowerCase(), password);
      if (res.otpRequired) {
        setMaskedEmail(res.maskedEmail || '');
        setStep('otp');
      }
      // sinon : la session est ouverte, le navigateur bascule automatiquement.
    } catch (e) {
      Alert.alert('Échec de connexion', errMsg(e, "Connexion impossible. Vérifie tes identifiants et l'adresse du serveur."));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (code.trim().length < 6) {
      Alert.alert('Code incomplet', 'Saisis le code à 6 chiffres reçu par e-mail.');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email.trim().toLowerCase(), code.trim(), remember);
    } catch (e) {
      Alert.alert('Vérification', errMsg(e, 'Code invalide. Réessaie.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await resendOtp(email.trim().toLowerCase());
      Alert.alert('Code renvoyé', 'Un nouveau code vient de t’être envoyé par e-mail.');
    } catch (e) {
      Alert.alert('Renvoi', errMsg(e, 'Impossible de renvoyer le code pour le moment.'));
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

        {step === 'creds' ? (
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
            <View style={styles.pwdWrap}>
              <TextInput
                style={[styles.input, { paddingRight: 46 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textLight}
                secureTextEntry={!showPwd}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.pwdEye} onPress={() => setShowPwd((s) => !s)}>
                <Icon name={showPwd ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Se connecter</Text>}
            </TouchableOpacity>

            {!isOnline && (
              <Text style={styles.offline}>● Hors-ligne — connexion internet requise pour s'identifier</Text>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.otpTitle}>Vérification</Text>
            <Text style={styles.otpHint}>
              Saisis le code à 6 chiffres envoyé à {maskedEmail || 'ton adresse e-mail'}.
            </Text>

            <TextInput
              style={styles.otpInput}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              placeholderTextColor={colors.textLight}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRemember((r) => !r)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                {remember && <Icon name="check" size={13} color="#fff" />}
              </View>
              <Text style={styles.rememberText}>Se souvenir de cet appareil (30 jours)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading} activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Vérifier et se connecter</Text>}
            </TouchableOpacity>

            <View style={styles.otpFooter}>
              <TouchableOpacity onPress={() => { setStep('creds'); setCode(''); }}>
                <Text style={styles.linkMuted}>← Modifier l'identifiant</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.linkMuted}>Renvoyer le code</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  pwdWrap: { position: 'relative' },
  pwdEye: { position: 'absolute', right: 4, top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 10 },
  button: {
    backgroundColor: colors.red, borderRadius: radius.sm, paddingVertical: 14,
    alignItems: 'center', marginTop: 22,
  },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  offline: { color: colors.red, fontSize: 12, textAlign: 'center', marginTop: 12 },
  hint: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center', marginTop: 24, lineHeight: 18 },

  // Étape OTP
  otpTitle: { fontSize: 20, fontWeight: '800', color: colors.navy, marginBottom: 6 },
  otpHint: { fontSize: 13.5, color: colors.textMuted, lineHeight: 20, marginBottom: 18 },
  otpInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingVertical: 14, fontSize: 28, fontWeight: '800', color: colors.navy,
    backgroundColor: '#fff', textAlign: 'center', letterSpacing: 12,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: '#fff',
  },
  checkboxOn: { backgroundColor: colors.red, borderColor: colors.red },
  rememberText: { fontSize: 13.5, color: colors.text, fontWeight: '600', flexShrink: 1 },
  otpFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  linkMuted: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
});
