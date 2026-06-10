<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Sanctum : permet l'authentification SPA par cookie (frontend web).
        // Pour l'app mobile, on utilise simplement le token Bearer (pas de cookie).
        $middleware->validateCsrfTokens([
        'api/*',
        ]);

        $middleware->statefulApi();

        // Alias du middleware de role (admin | delegue | etudiant).
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Reponses JSON propres pour une API consommee par React Native.
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
            return response()->json(['message' => 'Non authentifie.'], Response::HTTP_UNAUTHORIZED);
        });
    })->create();
