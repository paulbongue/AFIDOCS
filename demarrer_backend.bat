@echo off
chcp 65001 >nul
title AFI-DOCS - Installation et demarrage du backend
cd /d "%~dp0backend"

echo ============================================================
echo   AFI-DOCS : installation + demarrage du backend Laravel
echo ------------------------------------------------------------
echo   AVANT DE LANCER :
echo     1) Ouvre XAMPP Control Panel
echo     2) Clique "Start" sur Apache ET sur MySQL
echo   Pre-requis : Composer installe (https://getcomposer.org)
echo ============================================================
echo.

REM --- Localiser PHP (PATH, sinon XAMPP) ----------------------------------
set "PHP=php"
where php >nul 2>nul
if errorlevel 1 set "PHP=C:\xampp\php\php.exe"
if not exist "%PHP%" if not "%PHP%"=="php" (
  echo [ERREUR] PHP introuvable. Installe XAMPP, ou ajoute php au PATH.
  pause & exit /b 1
)
echo PHP utilise : %PHP%

REM --- Composer ------------------------------------------------------------
where composer >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Composer introuvable.
  echo Installe-le : https://getcomposer.org/Composer-Setup.exe  puis relance.
  pause & exit /b 1
)

REM --- Creer la base via le MySQL de XAMPP (si dispo) ----------------------
set "MYSQL=C:\xampp\mysql\bin\mysql.exe"
if exist "%MYSQL%" (
  echo Creation de la base "afi_plateforme" si elle n'existe pas...
  "%MYSQL%" -u root -e "CREATE DATABASE IF NOT EXISTS afi_plateforme CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
) else (
  echo [INFO] mysql.exe de XAMPP introuvable : cree la base "afi_plateforme"
  echo        manuellement dans phpMyAdmin si l'etape migration echoue.
)

echo.
echo [1/5] Installation des dependances (composer install)...
call composer install --no-interaction --prefer-dist
if errorlevel 1 ( echo [ERREUR] composer install a echoue. & pause & exit /b 1 )

if not exist ".env" copy ".env.example" ".env" >nul

echo [2/5] Generation de la cle d'application...
"%PHP%" artisan key:generate --ansi

echo [3/5] Migrations...
"%PHP%" artisan migrate --force
if errorlevel 1 (
  echo [ERREUR] Migration impossible. MySQL est-il demarre dans XAMPP ?
  pause & exit /b 1
)

REM Seed UNIQUEMENT si la base est vide -> evite le doublon 'BAF' au redemarrage.
set "USERCOUNT=0"
if exist "%MYSQL%" (
  "%MYSQL%" -u root -N -e "SELECT COUNT(*) FROM afi_plateforme.users;" > "%TEMP%\afi_count.txt" 2>nul
  if exist "%TEMP%\afi_count.txt" set /p USERCOUNT=<"%TEMP%\afi_count.txt"
  del "%TEMP%\afi_count.txt" >nul 2>nul
)
if "%USERCOUNT%"=="0" (
  echo Base vide : chargement des donnees de demonstration...
  "%PHP%" artisan db:seed --force
) else (
  echo Donnees deja presentes : seed ignore.
  echo ^(Pour repartir de zero : lance reinitialiser_base.bat^)
)

echo [4/5] Lien symbolique de stockage (acces aux fichiers)...
"%PHP%" artisan storage:link

echo.
echo [5/5] Demarrage du serveur API sur http://localhost:8000
echo ------------------------------------------------------------
echo   Laisse CETTE fenetre ouverte tant que tu utilises l'app.
echo   Comptes de demo (mot de passe : password) :
echo     admin@afi.sn  .  delegue.ir@afi.sn  .  etudiant.ir@afi.sn
echo ------------------------------------------------------------
"%PHP%" artisan serve --host=0.0.0.0 --port=8000
pause
