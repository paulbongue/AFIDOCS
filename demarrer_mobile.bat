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

if not exist "node_modules" (
  echo Installation des dependances (npm install)... 2-4 min la 1re fois.
  call npm install
  if errorlevel 1 ( echo [ERREUR] npm install a echoue. & pause & exit /b 1 )
)

echo.
echo Demarrage d'Expo... un QR code va s'afficher.
echo   - Android : ouvre l'app Expo Go -^> "Scan QR code"
echo   - iPhone  : ouvre l'appareil photo -^> vise le QR -^> ouvre dans Expo Go
echo Laisse cette fenetre ouverte. Ctrl+C pour arreter.
echo.
call npx expo start
pause
