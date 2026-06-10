@echo off
chcp 65001 >nul
REM ===========================================================================
REM  Publication du projet AFI sur GitHub
REM  1) Cree un depot VIDE sur https://github.com/new (rien a cocher)
REM  2) Remplace REPO_URL ci-dessous par l'URL de ton depot
REM  3) Double-clique sur ce fichier
REM ===========================================================================

set "REPO_URL=https://github.com/paulbongue/AFIDOCS.git"

cd /d "%~dp0"

REM -- Verification Git --
where git >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Git n'est pas installe.
  echo Telecharge-le : https://git-scm.com/download/win
  pause & exit /b 1
)

REM -- Verification que l'URL a bien ete changee --
if "%REPO_URL%"=="https://github.com/TON-COMPTE/TON-REPO.git" (
  echo [ACTION REQUISE] Ouvre ce fichier et remplace REPO_URL par l'URL de ton depot GitHub.
  pause & exit /b 1
)

REM -- Initialisation Git si necessaire --
if not exist ".git" (
  git init
  git branch -M main
)

REM -- Configuration utilisateur --
git config user.name  "Paul BONGUE NDOUNGOU"
git config user.email "paulbongue43@gmail.com"

REM -- Commit --
git add -A
git commit -m "Plateforme AFI : backend Laravel 11 + app mobile Expo offline-first"

REM -- Remote --
git remote remove origin >nul 2>nul
git remote add origin %REPO_URL%

REM -- Push --
echo.
echo === Envoi vers GitHub ===
git push -u origin main

echo.
echo Termine. Verifie qu'aucune erreur n'apparait ci-dessus.
pause