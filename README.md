# Plateforme AFI — version mobile hors-ligne

Application **mobile offline-first** de diffusion des ressources pédagogiques de l'Université de l'Entreprise (AFI), accompagnée d'un **backend Laravel 11**.

Ce dépôt concrétise la dimension *mobile* du mémoire et l'objectif **« rendre la plateforme disponible sans connexion »** : un étudiant peut télécharger les supports de cours puis les consulter **hors-ligne**, sans internet.

```
Rendre la plateforme dispo sans connexion/
├── backend/    API REST Laravel 11 + MySQL + Sanctum (6 entités, Policy filière)
├── web/        Frontend React + Vite — 3 espaces séparés (Étudiant · Délégué · Admin)
└── mobile/     App React Native (Expo) offline-first (cache SQLite + fichiers locaux)
```

**Répartition des rôles (convention du secteur)** : la **plateforme web** porte tous les parcours — l'espace **Admin** (gestion pédagogique, utilisateurs, modération) et l'espace **Délégué** (publication) sont séparés de l'espace **Étudiant** (consultation). L'**app mobile** est une application compagnon orientée **consultation hors-ligne** pour les étudiants ; la gestion se fait au web.

---

## 1. Comment fonctionne le mode hors-ligne

L'app ne dépend pas du réseau pour afficher le contenu déjà synchronisé. Deux niveaux de cache local :

1. **Métadonnées (SQLite, `expo-sqlite`)** — à chaque ouverture *en ligne*, l'app synchronise le catalogue (filières → niveaux → matières) et la liste des ressources, et les stocke localement. La liste, la recherche et les filtres lisent **toujours** depuis SQLite : ils fonctionnent donc hors-ligne.
2. **Fichiers (`expo-file-system`)** — l'étudiant appuie sur *« Télécharger pour hors-ligne »* sur une ressource ; le fichier (PDF, DOCX…) est copié dans le stockage privé de l'app. L'onglet **Hors-ligne** liste tout ce qui est consultable sans connexion ; l'ouverture se fait depuis le fichier local.

La synchronisation des ressources est **incrémentale** : l'app envoie la date de dernière synchro (`?since=`) et ne reçoit que ce qui a changé. Un bandeau gris signale le mode hors-ligne, et le profil affiche la date de dernière synchro et le nombre de fichiers disponibles localement.

| Action | En ligne | Hors-ligne |
|---|---|---|
| Première connexion | ✅ | ❌ (internet requis une fois) |
| Parcourir / rechercher / filtrer | ✅ | ✅ (cache local) |
| Ouvrir un fichier déjà téléchargé | ✅ | ✅ |
| Télécharger un nouveau fichier | ✅ | ❌ |
| Commenter | ✅ | ❌ |

---

## 2. Prérequis

- **PHP 8.2+** et **Composer** (via XAMPP : Apache + MySQL + PHP)
- **MySQL 8** (inclus dans XAMPP)
- **Node.js 18+** et **npm**
- **Expo Go** sur ton téléphone (Android/iOS), ou un émulateur

---

## 3. Lancer le backend (Laravel)

```bash
cd backend

composer install                 # installe les dépendances (crée vendor/)
copy .env.example .env            # Windows  (cp .env.example .env sous macOS/Linux)
php artisan key:generate
```

Crée la base `afi_plateforme` dans phpMyAdmin (XAMPP), puis :

```bash
php artisan migrate --seed        # crée les tables + données de démo
php artisan storage:link          # rend les fichiers accessibles via /storage

# Démarre le serveur en écoutant sur le réseau local (important pour le mobile) :
php artisan serve --host=0.0.0.0 --port=8000
```

> Note l'**IP locale** de ton PC (`ipconfig` → *Adresse IPv4*, ex. `192.168.1.15`). Le téléphone et le PC doivent être sur le **même Wi-Fi**.

### Comptes de démonstration (mot de passe : `password`)

| Rôle | Email |
|---|---|
| Administrateur | `admin@afi.sn` |
| Délégué (filière IR) | `delegue.ir@afi.sn` |
| Étudiant | `etudiant.ir@afi.sn` |

*(un délégué par filière : `delegue.gl@afi.sn`, `delegue.baf@afi.sn`, etc.)*

---

## 4. Lancer le frontend web (React + Vite)

```bash
cd web
npm install
copy .env.example .env     # (cp .env.example .env sous macOS/Linux)
npm run dev                # ouvre http://localhost:5173
```

Connecte-toi avec un compte de démo : selon le rôle, tu arrives automatiquement dans l'espace correspondant.

- **`admin@afi.sn`** → espace Administration (tableau de bord, gestion pédagogique filière/niveau/matière, utilisateurs, modération).
- **`delegue.ir@afi.sn`** → espace Délégué (publication directe filière verrouillée, mes ressources).
- **`etudiant.ir@afi.sn`** → espace Étudiant (ressources toutes filières, recherche, détail, commentaires).

> Le backend doit tourner (section 3). Si tu changes son URL/port, édite `web/.env` (`VITE_API_URL`).

---

## 5. Lancer l'app mobile (Expo)

```bash
cd mobile
npm install
```

Ouvre `mobile/src/config.js` et remplace l'IP par celle de ton PC :

```js
export const API_URL = 'http://192.168.1.15:8000/api';   // <-- ton IP
```

Puis :

```bash
npm start                # ouvre Expo ; scanne le QR code avec Expo Go
```

Cas particuliers d'`API_URL` : émulateur Android = `http://10.0.2.2:8000/api` ; navigateur (`expo start --web`) = `http://localhost:8000/api`.

### Tester le hors-ligne
1. Connecte-toi (en ligne) → la liste se synchronise.
2. Ouvre une ressource → *« Télécharger pour hors-ligne »*.
3. Active le **mode avion**.
4. Rouvre l'app : la liste reste visible et le fichier téléchargé s'ouvre. ✅

---

## 6. Architecture technique

**Backend** — Laravel 11, MySQL 8, authentification par token **Sanctum**, 6 modèles Eloquent (`User`, `Filiere`, `Niveau`, `Matiere`, `Ressource`, `Commentaire`). Sécurité : middleware de rôle (`admin` / `delegue` / `etudiant`) + **Policy filière** (un délégué ne publie que dans sa filière, vérifié côté serveur → 403 sinon). Publication directe, sans colonne `statut` (choix de conception du mémoire).

**Mobile** — React Native via Expo. Navigation par onglets (Ressources / Hors-ligne / Profil). Stockage local SQLite pour les métadonnées, `expo-file-system` pour les fichiers, `@react-native-community/netinfo` pour détecter l'état réseau, `axios` pour l'API.

```
[ App Expo ] --HTTP/Bearer--> [ API Laravel ] --> [ MySQL ]
     |                                              |
 [ SQLite local ] <--- sync incrémentale ---  [ /storage fichiers ]
 [ fichiers locaux (offline) ]
```

---

## 7. Principaux points de terminaison de l'API

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| POST | `/api/login` | public | Connexion → token Sanctum |
| GET | `/api/me` | auth | Profil courant |
| GET | `/api/filieres` | auth | Catalogue filières/niveaux/matières |
| GET | `/api/ressources` | auth | Liste **toutes filières** (`?search=&filiere_id=&since=`) |
| GET | `/api/ressources/{id}` | auth | Détail + commentaires |
| POST | `/api/ressources` | délégué | Publication directe (Policy filière) |
| POST | `/api/ressources/{id}/commentaires` | auth | Commenter (inter-filières) |
| GET | `/api/admin/stats` | admin | Statistiques tableau de bord |

---

## 8. Notifications (in-app · email · push)

À chaque publication d'une ressource par un délégué, **les étudiants de la filière concernée** sont notifiés sur trois canaux :

- **In-app** — notification stockée en base (table `notifications` de Laravel), affichée via la cloche 🔔 du web (compteur de non-lus + liste) et l'onglet **Notifs** de l'app mobile (avec badge). Fonctionne immédiatement, sans configuration.
- **Email** — envoyé via le système de notifications Laravel. Par défaut `MAIL_MAILER=log` : les emails sont écrits dans `backend/storage/logs/laravel.log` (pratique pour tester sans serveur mail). Pour de vrais envois, passe `MAIL_MAILER=smtp` et renseigne le SMTP dans `.env` (Mailtrap en test ; Gmail/SendGrid/Brevo en prod).
- **Push mobile** — via l'API **Expo Push**. L'app enregistre le jeton de l'appareil à la connexion (`POST /me/push-token`) ; le backend envoie le push aux étudiants concernés. Nécessite un **téléphone réel** (pas d'émulateur) et, pour Android en standalone, un build Expo configuré.

Endpoints : `GET /api/notifications`, `POST /api/notifications/{id}/read`, `POST /api/notifications/read-all`, `POST /api/me/push-token`.

> Cette fonctionnalité a ajouté des tables/colonnes : pense à relancer **`reinitialiser_base.bat`** (`migrate:fresh --seed`) après mise à jour du schéma.

---

## 9. Mettre le projet sur GitHub

Le dépôt est déjà prêt (`.gitignore` configurés : `vendor/`, `node_modules/` exclus). Crée un dépôt **vide** sur github.com, puis :

```bash
cd "Rendre la plateforme dispo sans connexion"
git init
git add .
git commit -m "Plateforme AFI : backend Laravel + app mobile offline"
git branch -M main
git remote add origin https://github.com/<ton-compte>/<ton-repo>.git
git push -u origin main
```
