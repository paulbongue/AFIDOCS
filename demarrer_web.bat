@echo off
chcp 65001 >nul
title AFI-DOCS - Frontend web (React + Vite)

:: -- Diagnostic --
echo Dossier du script : %~dp0
echo.
echo Contenu du dossier :
dir /b "%~dp0"
echo.

:: -- Navigation vers le frontend --
if not exist "%~dp0web" (
  echo [ERREUR] Le dossier "web" est introuvable a cote de ce .bat
  echo Verifie le nom exact du dossier frontend ci-dessus.
  pause & exit /b 1
)

cd /d "%~dp0web"

echo ============================================================
echo   AFI-DOCS : frontend web
echo   (Lance d'abord demarrer_backend.bat dans une autre fenetre)
echo ============================================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js / npm introuvable.
  echo Installe Node.js (LTS) : https://nodejs.org puis relance.
  pause & exit /b 1
)

if not exist "node_modules" (
  echo Installation des dependances npm install... cela peut prendre 1-2 min.
  call npm install
  if errorlevel 1 ( echo [ERREUR] npm install a echoue. & pause & exit /b 1 )
)

if not exist ".env" (
  if exist ".env.example" (
    copy ".env.example" ".env" >nul
    echo Fichier .env cree depuis .env.example
  ) else (
    echo [ATTENTION] Pas de .env ni de .env.example trouve.
  )
)

echo.
echo Demarrage du frontend sur http://localhost:5173
echo Laisse cette fenetre ouverte. Ctrl+C pour arreter.
echo.
call npm run dev
pause