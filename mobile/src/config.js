// ---------------------------------------------------------------------------
// Configuration de l'API
// ---------------------------------------------------------------------------
// IMPORTANT : sur un telephone physique (Expo Go), "localhost" pointe vers le
// telephone lui-meme, PAS vers ton PC. Remplace l'adresse ci-dessous par l'IP
// locale de ton ordinateur sur le reseau Wi-Fi (ex : 192.168.1.15).
//   - Trouver l'IP : Windows -> `ipconfig` -> "Adresse IPv4".
//   - Le backend doit ecouter sur cette IP :  php artisan serve --host=0.0.0.0
//
// Cas particuliers :
//   - Emulateur Android Studio : http://10.0.2.2:8000/api
//   - Navigateur (expo web)     : http://localhost:8000/api
// ---------------------------------------------------------------------------

export const API_URL = 'http://192.168.1.10:8000/api';

// Duree (ms) au-dela de laquelle une requete est consideree en echec.
export const REQUEST_TIMEOUT = 10000;
