// ---------------------------------------------------------------------------
// Chargement CONDITIONNEL de la connexion Google.
// ---------------------------------------------------------------------------
// @react-native-google-signin/google-signin est un module NATIF : il n'existe
// pas dans Expo Go (erreur « RNGoogleSignin could not be found » au démarrage).
// On ne le charge donc que dans une build autonome (APK/IPA). Dans Expo Go, on
// expose des valeurs neutres et `googleAvailable = false` : le bouton Google est
// alors simplement masqué, et le reste de l'application fonctionne normalement.
// ---------------------------------------------------------------------------

import Constants from 'expo-constants';

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === 'storeClient';

let GoogleSignin = null;
let statusCodes = {};
let googleAvailable = false;

if (!isExpoGo) {
  try {
    const mod = require('@react-native-google-signin/google-signin');
    GoogleSignin = mod.GoogleSignin;
    statusCodes = mod.statusCodes || {};
    googleAvailable = !!GoogleSignin;
  } catch (e) {
    // Module natif indisponible (ex. environnement non pris en charge).
    googleAvailable = false;
  }
}

export { GoogleSignin, statusCodes, googleAvailable };
