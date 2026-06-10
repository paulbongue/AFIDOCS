@echo off
chcp 65001 >nul
REM ===========================================================================
REM  Publication du projet AFI sur GitHub  (a executer sur Windows)
REM ---------------------------------------------------------------------------
REM  ETAPES :
REM   1) Cree un depot VIDE sur  https://github.com/new
REM      -> NE coche RIEN (pas de README, pas de .gitignore, pas de licence)
REM   2) Copie l'URL du depot (bouton vert "Code" -> HTTPS) et colle-la
REM      ci-dessous a la place de REPO_URL
REM   3) Enregistre ce fichier, puis double-clique dessus
REM      (une fenetre de connexion GitHub peut s'ouvrir : connecte-toi)
REM ===========================================================================

set "REPO_URL=https://github.com/TON-COMPTE/TON-REPO.git"

cd /d "%~dp0"

where git >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Git n'est pas installe.
  echo Telecharge-le ici puis relance ce script : https://git-scm.com/download/win
  pause
  exit /b 1
)

if "%REPO_URL%"=="https://github.com/paulbongue/AFIDOCS.git" (
  echo [ACTION REQUISE]
  echo Ouvre ce fichier avec le Bloc-notes et remplace REPO_URL par l'URL
  echo de TON depot GitHub, puis relance.
  pause
  exit /b 1
)

if not exist ".git" (
  git init
  git branch -M main
)

git config user.name  "Paul BONGUE NDOUNGOU"
git config user.email "paulbongue43@gmail.com"

git add -A
git commit -m "Plateforme AFI : backend Laravel 11 + app mobile Expo offline-first"

git remote remove origin >nul 2>nul
git remote add origin %REPO_URL% 

echo.
echo === Envoi vers GitHub ===
git push -u origin main

echo.
echo Termine. Si aucune erreur ci-dessus, ton code est en ligne sur GitHub.
pause
