<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClasseController;
use App\Http\Controllers\CommentaireController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FiliereController;
use App\Http\Controllers\MatiereController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\NiveauController;
use App\Http\Controllers\RessourceController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|---------------------------------------------------------------------------
| Routes API - Plateforme AFI
|---------------------------------------------------------------------------
| Trois groupes proteges par le middleware de role :
|   - Routes publiques          : /login
|   - Routes authentifiees       : tout utilisateur (consultation, commentaires)
|   - Routes /delegue/*          : publication directe (role delegue)
|   - Routes /admin/*            : gestion (role admin)
*/

// --- Public -----------------------------------------------------------------
Route::post('/login', [AuthController::class, 'login']);

// --- Authentifie (admin | delegue | etudiant) -------------------------------
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/me/password', [AuthController::class, 'updatePassword']);
    Route::post('/me/push-token', [AuthController::class, 'updatePushToken']);

    // Notifications in-app (cloche)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);

    // Catalogue (filieres -> niveaux -> matieres) : alimente filtres + cache offline.
    Route::get('/filieres', [FiliereController::class, 'index']);

    // Ressources : consultation TOUTES FILIERES (acces libre).
    Route::get('/ressources', [RessourceController::class, 'index']);
    Route::get('/ressources/{ressource}', [RessourceController::class, 'show']);

    // Commentaires inter-filieres.
    Route::get('/ressources/{ressource}/commentaires', [CommentaireController::class, 'index']);
    Route::post('/ressources/{ressource}/commentaires', [CommentaireController::class, 'store']);
    Route::delete('/commentaires/{commentaire}', [CommentaireController::class, 'destroy']);

    // --- Delegue : publication directe --------------------------------------
    Route::middleware('role:delegue')->group(function () {
        Route::post('/ressources', [RessourceController::class, 'store']);
        Route::put('/ressources/{ressource}', [RessourceController::class, 'update']);
        // suppression : delegue (ses ressources) OU admin -> gere par la Policy
        Route::delete('/ressources/{ressource}', [RessourceController::class, 'destroy']);
    });

    // --- Admin : gestion + moderation ---------------------------------------
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/stats', [DashboardController::class, 'stats']);

        // Centre de contrôle : délégués par classe (niveau)
        Route::get('/classes', [ClasseController::class, 'index']);
        Route::post('/classes/{niveau}/delegue', [ClasseController::class, 'assignDelegate']);
        Route::delete('/classes/{niveau}/delegue/{user}', [ClasseController::class, 'revokeDelegate']);

        Route::apiResource('users', UserController::class)->except(['show']);

        Route::post('/filieres', [FiliereController::class, 'store']);
        Route::put('/filieres/{filiere}', [FiliereController::class, 'update']);
        Route::delete('/filieres/{filiere}', [FiliereController::class, 'destroy']);

        Route::post('/niveaux', [NiveauController::class, 'store']);
        Route::put('/niveaux/{niveau}', [NiveauController::class, 'update']);
        Route::delete('/niveaux/{niveau}', [NiveauController::class, 'destroy']);

        Route::post('/matieres', [MatiereController::class, 'store']);
        Route::put('/matieres/{matiere}', [MatiereController::class, 'update']);
        Route::delete('/matieres/{matiere}', [MatiereController::class, 'destroy']);

        // moderation : suppression de toute ressource par l'admin
        Route::delete('/ressources/{ressource}', [RessourceController::class, 'destroy']);
    });
});
