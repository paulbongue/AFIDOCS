<?php

return [

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Connexion « Se connecter avec Google » : identifiant client OAuth (web).
    // C'est ce même Client ID qui sert d'audience (aud) attendue dans l'ID token,
    // que le token vienne du web (GIS) ou du mobile (webClientId).
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
    ],

];
