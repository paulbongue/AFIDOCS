# PROMPT DE REPRISE — PROJET AFI-DOCS
> **Mode d'emploi :** sur une nouvelle machine, ouvre une conversation neuve et **colle l'intégralité de ce fichier** comme premier message. Puis ajoute en une ligne ce que tu veux faire ce jour-là.

---

Tu reprends un travail en cours. Voici tout le contexte. Commence par cloner le dépôt et lire l'état réel des fichiers avant toute action : ne te fie pas à ce résumé pour les détails techniques, vérifie dans le code.

## 1. Qui je suis, et ce qu'on fait

Je suis **Paul Daryll BONGUE NDOUNGOU**, étudiant en **Master 2 Génie Logiciel (option IR/DevWEB)** à **AFI — L'Université de l'Entreprise (AFI-L'UE)**, Dakar, Sénégal. Année **2025-2026**.

- Directeur de mémoire : **Pr. Mouhamed El Bachir WADE** (professeur titulaire, UCAD)
- Co-encadrant : **M. Bamba Lo Ahmadou** (AFI-L'UE)

Mon mémoire : **« Conception et réalisation d'une plateforme web et mobile de gestion et de diffusion des ressources pédagogiques accessible hors connexion : cas d'AFI-L'UE »**. La plateforme s'appelle **AFI-DOCS**. Elle est réellement développée et déployée.

On travaille sur **deux choses en parallèle** : le **code** de la plateforme, et le **document du mémoire** (Word).

## 2. Récupérer le projet

Le dépôt est **privé** : `https://github.com/paulbongue/AFIDOCS.git` — branche **`main`**. Il contient **le code ET les fichiers .docx du mémoire** (31 fichiers .docx suivis).

**C'est moi qui clone, pas toi.** Tu n'as pas accès à mon compte GitHub et tu ne dois jamais me demander de jeton d'accès. La procédure est :

1. **Je** clone le dépôt sur la nouvelle machine (`git clone …`, mes identifiants saisis par moi).
2. **Je te connecte le dossier local** obtenu : c'est là que tu travailles, comme tu l'as toujours fait.

Tu ne lis donc jamais GitHub directement : tu lis le **dossier local connecté**. Ton environnement peut techniquement joindre GitHub en lecture pour un dépôt public, mais le dépôt étant privé, cette voie est fermée — et elle est inutile.

Arborescence :

- `backend/` — API Laravel 11 (PHP 8.2+), MySQL 8, Sanctum
- `web/` — application React + Vite (SPA)
- `mobile/` — application React Native / Expo (Android)
- racine — les fichiers du mémoire (`Memoire_AFI-DOCS_FINAL_GAMMA_v*.docx`), les dossiers `Diagrammes_AFI-DOCS/`, `Maquettes_AFI-DOCS/`, `Postman_Tests_Securite/`, `Graphiques_Questionnaire/`

## 3. La plateforme : architecture et fonctionnement

**Trois rôles** : Administrateur (peut être multiple, sans filière ni classe), Délégué (**un seul par classe**, publie directement dans sa filière), Étudiant.

**Règle d'accès centrale** — à ne jamais casser : un étudiant accède aux ressources où `filiere_id = user.filiere_id` **ET** `matiere.niveau.ordre <= user.niveau.ordre` (sa filière, son niveau et les niveaux **inférieurs**). L'année académique est un filtre, le semestre un attribut. Ce contrôle est appliqué **côté serveur** (`RessourceController`, `CommentaireController`).

**Modèles Eloquent (14)** : User, Filiere, Niveau, Matiere, Ressource, Commentaire, AnneeAcademique, Evaluation, ClassMessage, Post, PostComment, Schedule, Activite, TrustedDevice.

**Fonctionnalités livrées** : diffusion hiérarchique (filière → niveau → matière), recherche multicritère, commentaires (bornés au périmètre), discussion de classe, annonces, emploi du temps, notifications (in-app + push Expo/FCM + e-mail), double authentification par OTP e-mail, connexion Google, appareils de confiance, import CSV de cohortes (détection tolérante des colonnes), vidage d'une classe, évaluation anonyme des enseignants (grille 15 critères /20, résultats agrégés, impression par module dès 80 % de participation), journal d'activité web/mobile, rapport CSV, chatbot d'aide FAQ (règles, sans API externe), notification de mise à jour de l'app (comparaison de version au démarrage via `GET /api/app-version`).

**Mobile** : consultation hors connexion en **lecture seule** via SQLite embarquée (`expo-sqlite`). Ce n'est pas un offline-first complet (pas de résolution de conflits) — le mémoire le dit explicitement.

**Production** : VPS OVH, Nginx, `https://afidocs.duckdns.org`.

## 4. Déploiement (procédure exacte)

Sur mon PC : `git add . && git commit -m "..." && git push`

Sur le VPS :
```bash
cd <dossier backend>      # celui qui contient artisan
git pull
php artisan migrate --force     # seulement s'il y a des migrations
php artisan config:clear
cd ../web && npm run build
```

Mobile : `cd mobile && eas build -p android --profile preview`

**Interdits absolus** : ne jamais lancer `php artisan optimize`. Ne jamais me demander mes mots de passe ni les saisir — **je saisis moi-même tous les identifiants** (SSH, MySQL, etc.).

**Notification de mise à jour de l'app** : à chaque release, je bumpe `version` et `android.versionCode` dans `mobile/app.json`, je builde, je mets l'APK en ligne, puis je passe `APP_LATEST_VERSION` dans le `.env` du VPS + `php artisan config:clear`. Le lien de l'APK est dans `web/src/pages/LandingPage.jsx` et dans `backend/config/appupdate.php`.

## 5. Règles de travail — impératives

1. **Ne jamais fabriquer de données.** Mon questionnaire compte **6 réponses réelles** (5 étudiants, 1 administration ; 2 réponses à la section délégués). Aucun pourcentage sur n=6 : toujours des **effectifs bruts** (« cinq sur six »). Aucune mesure de performance, aucun test de charge, aucun taux de satisfaction inventé. Une IA m'a déjà proposé de faux chiffres (94 répondants, 91 % de satisfaction, 0,62 s de temps de réponse) : c'est à refuser, c'est de la fraude académique.
2. **Références vérifiables uniquement.** Pas de source inventée.
3. **Ma voix d'étudiant** dans le mémoire : français académique simple et sobre. Interdits : « il convient de noter », « force est de constater », « en somme », « joue un rôle clé », « s'inscrit pleinement dans ». Pas d'empilement de connecteurs, pas de systématisation des énumérations à trois termes. Privilégier la formulation la plus courte à contenu égal.
4. **Corrections ciblées** sur le .docx avec **python-docx**, jamais de régénération complète : le fichier contient mes retouches manuelles (page de garde, captures d'écran, légendes).
5. **Le montage de fichiers sert parfois des copies tronquées** d'un .docx que je viens d'ouvrir dans Word (zip invalide, ou lecture coupée en plein milieu). Solution : je fais une **copie dans l'Explorateur Windows** (Ctrl+C / Ctrl+V) et tu lis la copie. Pour le code, l'outil de lecture de fichiers est fiable ; les erreurs de syntaxe « en fin de fichier » signalées par un parseur via le shell sont généralement des artefacts de troncature, à vérifier avec l'outil de lecture avant de « corriger ».
6. **Versionnage du mémoire** : un nouveau fichier `..._vN.docx` à chaque étape (ne pas écraser). La version de référence actuelle est indiquée ci-dessous.
7. Mot de passe par défaut des comptes créés : `Afi@2026` (décision assumée, mentionnable dans le mémoire).

## 6. État du mémoire

**Version de référence : `Memoire_AFI-DOCS_FINAL_GAMMA_v16.docx`** (~21 500 mots, 7 tableaux, 36 images).

Structure : Introduction générale · Partie 1 (Ch. I cadre théorique/légal/réglementaire — 3 sections dont une juridique ; Ch. II contexte + benchmark) · Partie 2 (Ch. III méthodologie + DSR + critères de validation ; Ch. IV démonstration ; Ch. V analyse + discussion + recommandations) · Conclusion générale · Bibliographie (6 rubriques) · 3 annexes.

**Mise en forme (canevas AFI)** : A4, Times New Roman 12, interligne 1,5, justifié, titres soulignés avec retrait progressif (H1 = 0, H2 = 0,5 cm, H3 = 1 cm). Pagination en 3 blocs : chiffres romains (liminaires), arabes (à partir de l'introduction), lettres A/B/C (de la bibliographie à la fin). **Sommaire, liste des figures et liste des tableaux sont des champs automatiques** : les légendes portent les styles `LegendeFigure` et `LegendeTableau`, et il faut faire **Ctrl+A → F9** dans Word après chaque modification.

**Positionnement scientifique** : Design Science Research (Hevner et al., 2004 ; Peffers et al., 2007). Auteurs mobilisés : Vygotsky (1978), Norman (2013), Fielding (2000), Newman (2015), Naveh et al. (2010), Mtebe & Raisamo (2014), Kleppmann et al. (2019), UNESCO (2023), GSMA (2024). Cadre légal : lois sénégalaises n° 2008-12 (données personnelles, CDP) et n° 2008-09 (droit d'auteur).

**Formulation des hypothèses — à ne pas affaiblir ni renforcer** : les 4 hypothèses sont **« corroborées sur le plan de la faisabilité et de la pertinence »**, et **non démontrées quant à leurs effets**. Ne jamais réécrire « l'hypothèse est confirmée ».

Fichiers annexes utiles : `Memo_soutenance_AFI-DOCS.docx` (questions du jury et réponses), `Journal_modifications_v11_vers_v14.docx` (historique avant/après).

## 7. Ce qui reste à faire

**Mémoire**
- Ctrl+A → F9 final dans Word (sommaire + listes + pagination) après la dernière modification.
- Vérifier auprès de l'encadrant les références juridiques exactes (lois 2008-12 et 2008-09).
- Vérifier le numéro d'arrêté de l'avant-propos (`n° 066176/MEN/DEP`) et les sigles CCPA / EFAD.
- Optionnel, à fort rendement : test d'utilisabilité avec 5 à 8 étudiants (chronométrer « retrouver le cours X » sur WhatsApp puis sur AFI-DOCS) — c'est la seule chose qui ferait passer H1 de corroborée à démontrée. J'ai décidé de le laisser de côté pour l'instant.

**Code (dettes techniques connues, déjà écrites dans les limites du mémoire)**
- Les fichiers déposés sont servis depuis un répertoire public : le contrôle d'accès par filière protège l'API, **pas les fichiers**. Correctif : stockage privé + route Laravel de streaming soumise à la Policy. **C'est la priorité.**
- Jeton Sanctum stocké en `localStorage` (exposé au XSS) : piste cookie `httpOnly` + CSP.
- Notifications push : vérifier la clé **FCM V1** (compte de service Google) dans les credentials Expo — sans elle, l'APK autonome ne reçoit rien. `ExpoPushService` ne lit pas les accusés de réception, donc les erreurs de livraison sont invisibles.
- Domaine DuckDNS à remplacer par un sous-domaine de l'établissement pour un usage institutionnel.
- **Comptes de démonstration** : le dépôt a été public un temps, et 19 commits touchent les `.docx` — les versions antérieures de l'Annexe 2 exposaient donc les trois comptes (dont l'administrateur) avec le mot de passe `password` sur l'URL de production. Le dépôt est désormais privé et le mémoire ne les affiche plus, mais l'historique reste. **Ces mots de passe doivent être changés côté serveur** (et ne pas reprendre `Afi@2026`, valeur mentionnée dans le mémoire). Vérifier aussi qu'aucun `.env` du backend n'a jamais été committé.

## 8. Ton environnement de travail : à vérifier et compléter

Ton bac à sable Linux contient déjà, en principe : **python3** (avec `python-docx`, `Pillow`, `lxml`, `cairosvg`, `pdfplumber`, `matplotlib`, `openpyxl`, `python-pptx`), **Node 22**, **Graphviz** (`dot`), **pandoc**, **LibreOffice**, **pdftotext**, **ImageMagick**, **git** et **Java**.

**Premier réflexe : lancer ce contrôle**, et n'installer que ce qui manque.

```bash
for c in python3 node dot pandoc soffice pdftotext git; do
  printf "%-11s " "$c"; command -v $c >/dev/null && echo OK || echo ABSENT
done
for m in docx PIL cairosvg pdfplumber lxml matplotlib; do
  printf "%-11s " "$m"; python3 -c "import $m" 2>/dev/null && echo OK || echo ABSENT
done
```

Si un module Python manque, **le flag `--break-system-packages` est obligatoire** :

```bash
pip install python-docx cairosvg pdfplumber Pillow --break-system-packages -q
```

À quoi sert quoi, dans notre travail :

- **python-docx** — l'outil central : toutes les corrections du mémoire passent par lui (édition ciblée, styles, tableaux, champs TOC).
- **Graphviz (`dot`)** — génération des diagrammes UML et du schéma de base de données (dossier `Diagrammes_AFI-DOCS/`).
- **cairosvg** — conversion SVG → PNG haute résolution (diagrammes de séquence, cas d'utilisation, graphiques).
- **pdfplumber** — lecture des PDF (brief, canevas AFI).
- **LibreOffice / pdftotext** — vérification du rendu et de la pagination d'un .docx. Attention : LibreOffice **ne remplit pas** les champs TOC ; seul Word le fait avec Ctrl+A → F9.
- **Pillow / matplotlib** — dimensions d'images, graphiques.

**Trois limites de l'environnement, à connaître pour ne pas perdre de temps :**

1. **`php` est absent.** Impossible de faire `php -l` pour valider une modification du backend Laravel. Relis attentivement, et demande-moi de lancer le lint ou `php artisan` de mon côté.
2. **`npm install -g` échoue** (réseau restreint). N'essaie pas d'installer esbuild ou un autre binaire global. Pour valider un fichier JSX, utilise le parseur déjà présent dans le dépôt :
   ```bash
   cd web && node -e '
   const {parse}=require("@babel/parser");const fs=require("fs");
   parse(fs.readFileSync("src/pages/admin/UsersPage.jsx","utf8"),{sourceType:"module",plugins:["jsx"]});
   console.log("OK");'
   ```
   Et n'utilise **pas** `web/node_modules/.bin/esbuild` : c'est un binaire Windows, inutilisable sous Linux.
3. **Le montage de fichiers peut servir des données tronquées** (voir règle 5 de la section 5). Un `.docx` illisible en zip ou un fichier de code « coupé en fin de fichier » n'est presque jamais un vrai problème : demande-moi une copie Explorateur pour le .docx, et fie-toi à l'outil de lecture de fichiers pour le code.

## 9. Pour démarrer

1. Je te connecte le dossier du projet, puis tu lances le contrôle d'environnement de la section 8.
2. Confirme-moi ce que tu vois : dernier commit git, présence de `Memoire_AFI-DOCS_FINAL_GAMMA_v16.docx`, et les trois dossiers `backend/`, `web/`, `mobile/`.
3. Ne modifie rien avant que je te dise sur quoi on travaille.

---
*Dernière mise à jour de ce prompt : 26 juillet 2026.*
