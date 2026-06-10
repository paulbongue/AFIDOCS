@echo off
chcp 65001 >nul
title AFI-DOCS - Application mobile (Expo)
cd /d "%~dp0mobile"

echo ============================================================
echo   AFI-DOCS : application mobile (Expo)
echo ------------------------------------------------------------
echo   AVANT DE LANCER :
echo     1) demarrer_backend.bat tourne dans une autre fenetre
echo     2) Ton telephone et ce PC sont sur le MEME Wi-Fi
echo     3) "Expo Go" est installe sur ton telephone
echo        (Play Store / App Store)
echo     4) L'IP de ton PC est renseignee dans mobile\src\config.js
echo        -> ci-dessous, ton IPv4 actuelle :
echo ============================================================
ipconfig | findstr /C:"IPv4"
echo ============================================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js / npm introuvable.
  echo Installe Node.js (LTS) : https://nodejs.org  puis relance.
  pause & exit /b 1
)

REM --- Preparation SDK 54 (une seule fois) : aligne toutes les dependances ---
if not exist "node_modules\.afi_sdk54" (
  echo Premiere preparation pour Expo SDK 54 : nettoyage + installation...
  echo (cela peut prendre 3-6 min la premiere fois)
  if exist node_modules rmdir /s /q node_modules
  if exist package-lock.json del /q package-lock.json
  call npm install --legacy-peer-deps
  if errorlevel 1 ( echo [ERREUR] npm install a echoue. & pause & exit /b 1 )
  echo Alignement des versions sur le SDK 54...
  call npx expo install --fix
  echo ok> "node_modules\.afi_sdk54"
)

echo.
echo Demarrage d'Expo... un QR code va s'afficher.
echo   - Android : ouvre l'app Expo Go -^> "Scan QR code"
echo   - iPhone  : ouvre l'appareil photo -^> vise le QR -^> ouvre dans Expo Go
echo Laisse cette fenetre ouverte. Ctrl+C pour arreter.
echo.
call npx expo start
pause
