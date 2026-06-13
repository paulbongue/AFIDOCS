<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Connexion : verifie l'email + mot de passe (bcrypt) et renvoie un token Sanctum.
     * Le token est ensuite stocke par l'app et injecte en header Authorization: Bearer.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects.'],
            ]);
        }

        $deviceName = $credentials['device_name'] ?? $request->userAgent() ?? 'mobile';
        $token = $user->createToken($deviceName)->plainTextToken;

        // Limite a 3 appareils connectes : on ne garde que les 3 jetons les plus
        // recents (le plus ancien est deconnecte au-dela).
        $keep = $user->tokens()->orderByDesc('id')->take(3)->pluck('id');
        $user->tokens()->whereNotIn('id', $keep)->delete();

        $user->load('filiere', 'niveau');

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    /**
     * Profil de l'utilisateur connecte (utilise au demarrage de l'app).
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('filiere', 'niveau');

        return response()->json(['user' => $this->userPayload($user)]);
    }

    /**
     * Deconnexion : revoque le token courant.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Deconnecte.']);
    }

    /**
     * Deconnecte tous les AUTRES appareils (revoque tous les jetons sauf celui
     * de la requete en cours).
     */
    public function logoutOtherDevices(Request $request): JsonResponse
    {
        $current = $request->user()->currentAccessToken();
        $count = $request->user()->tokens()->where('id', '!=', $current->id)->count();
        $request->user()->tokens()->where('id', '!=', $current->id)->delete();

        return response()->json([
            'message' => 'Deconnecte des autres appareils.',
            'revoked' => $count,
        ]);
    }

    /**
     * Modification du mot de passe par l'utilisateur connecte.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        $user->update(['password' => $data['password']]);

        return response()->json(['message' => 'Mot de passe mis a jour.']);
    }

    /**
     * Enregistre (ou efface) le jeton de push Expo de l'appareil mobile.
     */
    public function updatePushToken(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['nullable', 'string', 'max:255'],
        ]);

        $request->user()->update(['expo_push_token' => $data['token'] ?? null]);

        return response()->json(['message' => 'Jeton push enregistre.']);
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'filiere_id' => $user->filiere_id,
            'filiere' => $user->filiere ? [
                'id' => $user->filiere->id,
                'code' => $user->filiere->code,
                'nom' => $user->filiere->nom,
                'couleur' => $user->filiere->couleur,
            ] : null,
            // Classe du délégué (= niveau précis de la filière).
            'niveau_id' => $user->niveau_id,
            'niveau' => $user->niveau ? [
                'id' => $user->niveau->id,
                'nom' => $user->niveau->nom,
            ] : null,
        ];
    }
}
