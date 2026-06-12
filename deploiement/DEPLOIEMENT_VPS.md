# Déploiement d'AFI-DOCS sur un VPS

Guide complet pour mettre la plateforme en ligne (backend Laravel + base MySQL + fichiers + frontend React) sur un seul VPS Ubuntu, en HTTPS, avec sauvegardes automatiques.

> Les valeurs entre `< >` sont à remplacer par les tiennes. Les commandes se lancent en SSH sur le serveur, en root (ou avec `sudo`).

---

## 0. Prérequis

- Un VPS **Ubuntu 22.04 ou 24.04** (ex. Hetzner CX22, ~4 €/mois) et son **adresse IP**.
- Un accès **SSH** au serveur (`ssh root@<IP_DU_VPS>`).
- Le code du projet sur **GitHub** (déjà fait via `push_to_github.bat`).

---

## 1. Un nom de domaine gratuit (HTTPS)

Un VPS ne fournit qu'une IP. Pour le HTTPS (obligatoire, sinon l'app mobile Android refuse de se connecter), il faut un nom d'hôte. Gratuit avec **DuckDNS** :

1. Va sur https://www.duckdns.org, connecte-toi (Google/GitHub).
2. Crée un sous-domaine, ex. `afidocs` → tu obtiens `afidocs.duckdns.org`.
3. Dans le champ « current ip », mets l'**IP de ton VPS**, puis « update ip ».

Ton domaine est `afidocs.duckdns.org`. Utilise-le partout ci-dessous.

---

## 2. Installation des dépendances

Copie le dépôt sur le serveur puis lance le script d'installation :

```bash
cd /var/www
git clone <URL_DE_TON_DEPOT_GITHUB> afidocs
cd afidocs
bash deploiement/setup_vps.sh
```

Cela installe Nginx, PHP 8.2, MySQL, Composer, Node.js, Certbot, le pare-feu et fail2ban.

---

## 3. Base de données

Sécurise MySQL puis crée la base et un utilisateur **dédié** (pas root) :

```bash
mysql_secure_installation     # réponds "oui" partout, choisis un mot de passe root
mysql -u root -p
```

Dans l'invite MySQL (remplace le mot de passe) :

```sql
CREATE DATABASE afi_plateforme CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'afi_user'@'localhost' IDENTIFIED BY '<MOT_DE_PASSE_FORT_BDD>';
GRANT ALL PRIVILEGES ON afi_plateforme.* TO 'afi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 4. Backend Laravel

```bash
cd /var/www/afidocs/backend
composer install --no-dev --optimize-autoloader

# Configuration de production
cp .env.production.example .env
nano .env        # renseigne APP_URL, DB_PASSWORD, FRONTEND_URL, SANCTUM_STATEFUL_DOMAINS avec ton domaine
php artisan key:generate

# Base + données de démonstration, lien des fichiers, caches
php artisan migrate --seed
php artisan storage:link
php artisan config:cache && php artisan route:cache

# Droits d'écriture pour le serveur web
chown -R www-data:www-data storage bootstrap/cache
```

---

## 5. Frontend React

Le frontend et l'API sont sur le même domaine : on configure l'API en relatif (`/api`).

```bash
cd /var/www/afidocs/web
echo "VITE_API_URL=/api" > .env.production
npm install
npm run build      # génère le dossier web/dist servi par Nginx
```

---

## 6. Nginx

```bash
cp /var/www/afidocs/deploiement/nginx-afidocs.conf /etc/nginx/sites-available/afidocs
nano /etc/nginx/sites-available/afidocs     # remplace afidocs.duckdns.org par ton domaine
ln -s /etc/nginx/sites-available/afidocs /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

À ce stade, le site répond en **HTTP** sur `http://afidocs.duckdns.org`.

---

## 7. HTTPS (certificat gratuit)

```bash
certbot --nginx -d afidocs.duckdns.org
```

Certbot obtient le certificat, configure le HTTPS et la redirection automatique HTTP→HTTPS. Le renouvellement est automatique.

Le site est en ligne : **https://afidocs.duckdns.org** 🎉

---

## 8. Sauvegardes automatiques

```bash
nano /var/www/afidocs/deploiement/sauvegarde.sh    # renseigne DB_PASS
chmod +x /var/www/afidocs/deploiement/sauvegarde.sh
crontab -e
```

Ajoute cette ligne (sauvegarde chaque nuit à 2 h, base + fichiers, 14 jours conservés) :

```
0 2 * * * /var/www/afidocs/deploiement/sauvegarde.sh >> /var/log/afi-backup.log 2>&1
```

Les sauvegardes sont dans `/var/backups/afidocs`. Pense à en copier régulièrement une hors du serveur (ton PC).

---

## 9. Faire une mise à jour plus tard

Quand tu modifies le code (depuis ton PC → `git push`), sur le serveur :

```bash
cd /var/www/afidocs
git pull

# Si le backend a changé :
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache

# Si le frontend a changé :
cd ../web && npm install && npm run build
```

Aucune perte de données : `migrate` n'ajoute que les nouveautés, la base et les fichiers restent intacts.

---

## 10. Application mobile

L'APK n'est pas hébergé sur le serveur : il pointe simplement vers l'API en ligne.

1. Dans `mobile/src/config.js`, fixe l'URL de production sur `https://afidocs.duckdns.org/api` (en plus de la détection auto pour le développement).
2. Génère l'APK via EAS (`npx eas build -p android --profile preview`) — étape détaillée à part le moment venu.

Une fois installé, l'app se connecte au serveur en ligne, synchronise, puis fonctionne **hors-ligne** sur le contenu téléchargé.

---

## Récapitulatif sécurité (déjà en place dans le code)

- `APP_DEBUG=false`, `APP_ENV=production` (aucune fuite d'info en cas d'erreur).
- HTTPS forcé + en-têtes de sécurité (anti-clickjacking, anti-sniffing, HSTS).
- Limitation des tentatives de connexion (anti-brute-force).
- CORS restreint à ton seul domaine.
- Mots de passe hachés (bcrypt), authentification par token.
- Pare-feu (UFW) + fail2ban + base accessible uniquement en local.
- Sauvegardes automatiques quotidiennes.
