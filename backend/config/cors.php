<?php

return [

    // Routes concernees par CORS.
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],

    'allowed_methods' => ['*'],

    // En developpement, on autorise toutes les origines (app Expo sur IP locale,
    // frontend Vite, emulateur). En production, restreindre a l'URL du frontend.
    'allowed_origins' => array_filter([
        env('FRONTEND_URL'),
        'http://localhost:5173',
        'http://localhost:8081',
        'http://localhost:19006',
    ]),

    // Autorise aussi les IP locales du reseau (Expo Go sur telephone : 192.168.x.x).
    'allowed_origins_patterns' => ['#^http://(192\.168|10|172)\.[0-9.]+(:[0-9]+)?$#'],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Token Bearer pour le mobile => pas besoin de cookies cross-site.
    'supports_credentials' => true,

];
