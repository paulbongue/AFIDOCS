@echo off
chcp 65001 >nul
title AFI-DOCS - Reinitialiser la base de donnees
cd /d "%~dp0backend"

echo ============================================================
echo   AFI-DOCS : reconstruction propre de la base de donnees
echo ------------------------------------------------------------
echo   A utiliser quand le schema a change (ex : ajout de la
echo   colonne niveau_id / "comptes disparus").
echo   /!\ EFFACE les donnees existantes et recharge la demo.
echo   Pre-requis : XAMPP -> MySQL DEMARRE.
echo ============================================================
echo.

REM --- Localiser PHP (PATH, sinon XAMPP) ----------------------------------
set "PHP=php"
where php >nul 2>nul
if errorlevel 1 set "PHP=C:\xampp\php\php.exe"
if not exist "%PHP%" if not "%PHP%"=="php" (
  echo [ERREUR] PHP introuvable. Installe XAMPP ou ajoute php au PATH.
  pause & exit /b 1
)

REM --- S'assurer que la base existe ---------------------------------------
set "MYSQL=C:\xampp\mysql\bin\mysql.exe"
if exist "%MYSQL%" (
  "%MYSQL%" -u root -e "CREATE DATABASE IF NOT EXISTS afi_plateforme CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
)

echo Reconstruction des tables + donnees de demonstration...
"%PHP%" artisan migrate:fresh --seed --force
if errorlevel 1 (
  echo [ERREUR] Echec. MySQL est-il bien demarre dans XAMPP ?
  pause & exit /b 1
)

"%PHP%" artisan storage:link 2>nul

echo.
echo ============================================================
echo   Base reconstruite avec succes.
echo   Comptes (mot de passe : password) :
echo     admin@afi.sn
echo     delegue.srt@afi.sn  (delegue de la classe SRT - M1)
echo     etudiant.srt@afi.sn
echo   Tu peux relancer demarrer_backend.bat (ou il tourne deja).
echo ============================================================
pause
