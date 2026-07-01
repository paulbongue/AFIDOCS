<?php

/*
|--------------------------------------------------------------------------
| Double authentification par e-mail (OTP)
|--------------------------------------------------------------------------
| 'enabled' est volontairement à FALSE par défaut : n'activer qu'APRÈS avoir
| configuré et testé un envoi d'e-mail réel (SMTP). Sinon, aucun utilisateur
| ne pourrait recevoir son code et donc se connecter.
*/

return [
    // Interrupteur global. Passe OTP_ENABLED=true dans .env quand le SMTP marche.
    'enabled' => (bool) env('OTP_ENABLED', false),

    // Longueur du code numérique.
    'length' => 6,

    // Durée de validité du code (minutes).
    'ttl_minutes' => (int) env('OTP_TTL_MINUTES', 10),

    // Nombre d'essais autorisés sur un même code avant de devoir en redemander un.
    'max_attempts' => (int) env('OTP_MAX_ATTEMPTS', 5),

    // Délai minimal entre deux envois de code (secondes) — anti-spam / anti-abus.
    'resend_cooldown_seconds' => (int) env('OTP_RESEND_COOLDOWN', 60),

    // Durée de confiance d'un appareil mémorisé (« se souvenir de cet appareil »).
    'trusted_days' => (int) env('OTP_TRUSTED_DAYS', 30),
];
