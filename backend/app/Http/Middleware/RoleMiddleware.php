<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * Verifie que l'utilisateur authentifie possede l'un des roles requis.
 * Usage dans les routes : ->middleware('role:admin') ou 'role:delegue,admin'.
 * Toute tentative non autorisee renvoie 403 Forbidden (sans message explicatif).
 */
class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): SymfonyResponse
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            return response()->json(['message' => 'Acces interdit.'], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
