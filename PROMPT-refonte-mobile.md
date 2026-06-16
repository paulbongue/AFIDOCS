# Prompt — Refonte UI de l'app mobile AFI-DOCS (d'après le design Lovable)

> À coller tel quel dans la conversation. Il décrit la cible visuelle (design généré sur Lovable,
> "University Hub Redesigned") **traduite pour la vraie stack du projet**.

---

## Contexte & contraintes (impératif)

L'app mobile est en **React Native / Expo** (package `sn.afi.docs`). Elle n'a **ni HTML, ni CSS, ni PHP** :
le style se fait avec `StyleSheet` en JavaScript. Le design Lovable est du React **web** : il sert
**uniquement de référence visuelle**, on ne copie pas son code.

Règles :
- **Ne touche à AUCUNE logique métier** : endpoints API, navigation, état, `client.js`, `config.js`,
  hooks de données, synchro hors-ligne, auth. On ne modifie que la **couche visuelle**
  (`StyleSheet`, structure JSX d'affichage, petits composants de présentation).
- Travaille dans `mobile/src/` : `theme.js`, `screens/*.js`, `components/*.js`, `RootNavigator.js`.
- Mobile-first (largeur cible 360–430 px). Police **Inter**.
- Conserver tous les textes, données et comportements actuels.

---

## 1. Charte — mettre à jour `mobile/src/theme.js`

Valeurs **exactes relevées du design** (OKLCH du projet Lovable converties en hex sRGB) :

| Token | Hex | Usage |
|---|---|---|
| `brand` | `#CF4238` | Rouge institutionnel : header, boutons primaires, état actif, accents |
| `brandDark` | `#0F1932` | Bleu nuit : avatars, titres forts, icône nav inactive |
| `bg` | `#F8FAFC` | Fond d'écran général |
| `surface` / `card` | `#FFFFFF` | Cartes, barres, composer |
| `border` | `#E1E5EA` | Bordures, séparateurs |
| `text` | `#081123` | Texte principal |
| `muted` | `#EFF2F5` | Fonds secondaires (pastilles, champs) |
| `textMuted` | `#5C646F` | Texte secondaire / métadonnées |
| `pdf` | `#8047E1` | Violet — fichiers PDF |
| `docx` | `#362AC1` | Bleu — fichiers Word/DOCX |
| `download` | `#23A136` | Vert — téléchargement / hors-ligne |
| `notif` | `#F3680F` | Orange — annonces / notifications |

Tokens dérivés à ajouter :
- `brandSoft` = `brand` à ~12 % d'opacité (`rgba(207,66,56,0.12)`) → pilule de nav active, bulle de
  message envoyé, badge de rôle.
- Rayons : `sm 10`, `md 12`, `lg 16`, `xl 20`, `2xl 24`.
- Ombre de carte : `shadowColor #0F172A`, `shadowOpacity 0.06`, `shadowRadius 12`, `shadowOffset {0,4}`,
  `elevation 2`.
- Police : `Inter` (charger via `expo-font` / `@expo-google-fonts/inter` si pas déjà fait ; sinon
  `System` en repli — ne pas casser le build).

---

## 2. Shell commun (header + barre de navigation)

**Header** (haut de chaque écran) :
- Bande **rouge `brand` pleine largeur**, **coins inférieurs arrondis (24 px)**.
- À gauche : bouton **recherche** rond (icône loupe sur léger fond translucide blanc).
- Centre : **« AFI-DOCS »** en blanc, gras, lettres espacées (letterSpacing ~3).
- À droite : **avatar circulaire** initiale (fond `brandDark`, texte blanc).

**Barre de navigation basse** (fixe, `RootNavigator.js`) — **6 onglets** :
`Accueil · Ressources · Échanges · Hors-ligne · Notifs · Profil`.
- Fond blanc, ombre portée vers le haut, icônes style **Lucide** (déjà dispo via les icônes du projet).
- **Onglet actif** = pilule `brandSoft` autour de l'icône + label en `brand`. Inactif = icône/label `textMuted`.
- **Badge** numérique rouge (cercle) en haut à droite de l'icône **Notifs** (nombre de non-lues).
- Labels sur **une ligne**, tronqués si besoin.

---

## 3. Écrans (référence visuelle Lovable → écran RN correspondant)

### Accueil
- Sous-titre **« BIENVENUE »** (petites majuscules, `textMuted`) puis **« Bonjour, {prénom} 👋 »** en gros titre.
- **3 cartes stats** sur une rangée (`flexDirection:'row'`, gap 8, chaque carte `flex:1`, rayon `2xl`,
  ombre de carte) : icône ronde colorée en haut à gauche, **grande valeur** en gras, **label** dessous.
  - Ressources (icône livre, violet) · Hors-ligne (icône download, vert) · Classe (icône diplôme,
    affiche le niveau ex. « GL » + « M2 · Génie Logiciel »).
- Section **« Ressources récentes »** + sous-texte « Mis à jour aujourd'hui » + lien **« Voir tout »**
  (en `brand`, à droite).
- **Liste dense de ressources** : carte blanche rayon `2xl`, à gauche **badge type de fichier**
  (carré arrondi coloré + libellé PDF/DOCX…), au centre **titre** + métadonnées (`filière · niveau · matière`
  puis taille), à droite **bouton télécharger** rond.

### Ressources
- Titre **« Explorer les ressources »** + sous-texte « N fichiers · N filières » ; bouton **« ← Ma classe »**
  (contour) à droite.
- **Barre de recherche** pleine largeur (champ blanc arrondi, loupe) + **bouton filtre** carré arrondi à droite.
- **Toggle Liste / Cartes** (deux boutons segmentés ; actif = `brand`).
- **Chips de filière** défilables : `Toutes` (active en `brand`) puis BAF, DWMD, GL, GRH, GSE… chaque chip
  avec **bordure + texte de la couleur de la filière**.
- Grille/liste de cartes ressources (mêmes cartes que l'Accueil ; en vue Cartes : 2 colonnes, badge en haut).

### Échanges
- **Onglets segmentés** « Ma classe » / « Annonces » (pilule active `brand` pleine largeur).
- En-tête « Ma classe — {filière} · {niveau} », sous-texte « Messages éphémères · 7 jours », **badge membres**
  « 👥 12 » à droite.
- **Carte épinglée « 📌 Emploi du temps »** : carte blanche avec **liseré gauche rouge**, gros bouton
  `brand` **« 📅 Ouvrir l'emploi du temps »**, sous-texte « Image · 634 Ko ».
- **Bulles de chat** :
  - **Reçu** (gauche) : avatar `brandDark` + **nom** + éventuel **badge de rôle** (ex. « DÉLÉGUÉ », petite
    pilule `brandSoft`/`brand`) au-dessus, **bulle blanche** (bordure légère).
  - **Envoyé** (droite) : nom + avatar à droite, **bulle `brandSoft` (rose pâle)**, lien **« 🗑 Supprimer »**
    sous la bulle.
- **Composer fixe** au-dessus de la nav : pièce jointe 📎 + champ « Écrire un message… » + emoji +
  **bouton d'envoi rond `brand`**.

### Hors-ligne
- Titre « TÉLÉCHARGEMENTS » / « Disponibles hors-ligne ».
- 2 cartes stats : « N Fichiers stockés » (vert) · « N o Espace utilisé » (violet).
- **État vide** : grand **cercle vert pâle avec icône dossier-download** centré + texte
  « Aucun fichier hors-ligne » (et sous-texte d'invite).

### Notifications
- Titre « ACTIVITÉ » / « Notifications » + lien **« Tout marquer lu »** (`brand`, droite).
- **Lignes de notification** : à gauche **icône ronde colorée par catégorie** (fond pâle) —
  message classe = violet (chat), annonce = orange (mégaphone), emploi du temps = bleu (agenda),
  nouveau membre = vert ; **titre** + **point rouge** si non-lue ; **description** ; **horodatage**
  « il y a … » ; **bouton ✕** à droite pour **supprimer** (déjà implémenté côté API).

### Profil
- **Carte d'identité** : grand avatar (initiale, fond `brandDark`) avec **pastille verte** « en ligne »,
  **nom**, **✉ email**, bouton **crayon** (modifier) en haut à droite ; dessous **badges**
  « {rôle} » (pilule grise) + « 🎓 {filière} · {niveau} » (pilule bleu pâle).
- **Grille stats 3 colonnes** : Ressources · Hors-ligne · Camarades.
- Section **« COMPTE & PARAMÈTRES »** : lignes (icône ronde colorée + **titre** + **sous-texte** + chevron ›)
  — Informations personnelles, **Synchronisation** *(à MASQUER si l'utilisateur est admin — déjà prévu)*,
  Sécurité — Mot de passe, Appareils connectés.
- **Bouton « Se déconnecter »** pleine largeur (fond rose pâle `brandSoft`, texte `brand`, icône logout).
- Pied : « AFI-DOCS · v{version} ».

---

## 4. Petits composants de présentation à factoriser

`components/` : `FileBadge` (carré arrondi coloré selon type), `ResourceCard`, `StatCard`,
`SettingRow` (icône+titre+sous-texte+chevron), `ChatBubble` (variante reçu/envoyé), `NotifRow`,
`EmptyState`, `SectionHeader`. Réutiliser le `theme.js` partout (aucune couleur en dur).

---

## 5. Interactions

- Tout élément tappable : retour visuel à l'appui (`activeOpacity ~0.8` ou léger `scale 0.98`).
- Pas de SPA/fetch pour naviguer : on garde la navigation existante (React Navigation).
- Toggle Liste/Cartes et onglets Ma classe/Annonces : simple bascule d'état local, données inchangées.
- Garder les **skeletons** au chargement (déjà présents).

---

## 6. Méthode de travail demandée

1. Mettre à jour `theme.js` avec la charte ci-dessus.
2. Faire l'**écran pilote Accueil** (+ shell header/nav) et me le montrer pour validation.
3. Une fois validé, dérouler les autres écrans dans l'ordre : Ressources, Échanges, Notifications,
   Profil, Hors-ligne.
4. Ne rebuild l'APK qu'à la fin (changements mobile uniquement).
