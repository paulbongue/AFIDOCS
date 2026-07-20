<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Mise à jour de l'application mobile
    |--------------------------------------------------------------------------
    | L'application mobile compare, au démarrage, sa propre version à celle
    | déclarée ici. Si la version publiée est plus récente, elle propose le
    | téléchargement via le lien ci-dessous.
    |
    | À CHAQUE nouvelle release de l'APK : incrémenter APP_LATEST_VERSION dans
    | le .env du serveur (et mettre à jour APP_APK_URL si besoin).
    */

    // Dernière version publiée de l'APK (doit correspondre au "version" de app.json).
    'version' => env('APP_LATEST_VERSION', '1.0.7'),

    // Lien de téléchargement de l'APK (page d'accueil ou fichier direct).
    'url' => env('APP_APK_URL', 'https://afidocs.duckdns.org/telecharger'),

    // Notes de version affichées à l'utilisateur (optionnel).
    'notes' => env('APP_UPDATE_NOTES', ''),

    // Si true, la mise à jour est présentée comme obligatoire.
    'mandatory' => (bool) env('APP_UPDATE_MANDATORY', false),
];
