#!/usr/bin/env bash
# ===========================================================================
#  AFI-DOCS — Installation des dependances sur un VPS Ubuntu 22.04 / 24.04
#  A lancer UNE FOIS, en root :  bash setup_vps.sh
#  N'introduit aucun secret : la base et le .env sont configures ensuite,
#  voir DEPLOIEMENT_VPS.md.
# ===========================================================================
set -euo pipefail

echo ">>> Mise a jour du systeme"
apt update && apt upgrade -y

echo ">>> Nginx, MySQL, utilitaires"
apt install -y nginx mysql-server unzip git curl ufw fail2ban

echo ">>> PHP 8.2 + extensions Laravel"
apt install -y php8.2-fpm php8.2-cli php8.2-mysql php8.2-mbstring \
  php8.2-xml php8.2-curl php8.2-zip php8.2-gd php8.2-bcmath php8.2-intl

echo ">>> Composer"
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer

echo ">>> Node.js 20 (pour construire le frontend React)"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo ">>> Certbot (HTTPS Let's Encrypt)"
apt install -y certbot python3-certbot-nginx

echo ">>> Pare-feu : on n'ouvre que SSH + HTTP + HTTPS"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo ">>> fail2ban (protege SSH contre le brute-force)"
systemctl enable --now fail2ban

echo ""
echo "=== Installation terminee. ==="
echo "Etapes suivantes : securiser MySQL (mysql_secure_installation),"
echo "creer la base, deployer le code, configurer le .env et Nginx."
echo "Voir DEPLOIEMENT_VPS.md."
