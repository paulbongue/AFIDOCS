<?php

namespace App\Http\Controllers;

use App\Models\Niveau;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Centre de contrôle (Admin) : attribution des droits de délégué PAR CLASSE.
 * Une classe = un niveau précis d'une filière (ex. « GL · M2 »).
 * L'admin désigne ou révoque le délégué d'une classe donnée.
 */
class ClasseController extends Controller
{
    /**
     * Liste des classes (niveaux) avec leur filière et leur(s) délégué(s) actuel(s),
     * et la liste des utilisateurs pouvant être désignés.
     */
    public function index(): JsonResponse
    {
        $classes = Niveau::with('filiere:id,code,nom,couleur')
            ->orderBy('filiere_id')
            ->orderBy('nom')
            ->get(['id', 'nom', 'filiere_id'])
            ->map(fn (Niveau $n) => [
                'niveau_id' => $n->id,
                'niveau' => $n->nom,
                'filiere' => $n->filiere,
                'delegues' => User::where('niveau_id', $n->id)
                    ->where('role', User::ROLE_DELEGUE)
                    ->get(['id', 'name', 'email']),
            ]);

        // Candidats : étudiants et délégués (pas les administrateurs).
        $candidats = User::whereIn('role', [User::ROLE_ETUDIANT, User::ROLE_DELEGUE])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'niveau_id']);

        return response()->json([
            'classes' => $classes,
            'candidats' => $candidats,
        ]);
    }

    /**
     * Désigner un utilisateur comme délégué de la classe.
     */
    public function assignDelegate(Request $request, Niveau $niveau): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $user = User::findOrFail($data['user_id']);
        $user->update([
            'role' => User::ROLE_DELEGUE,
            'niveau_id' => $niveau->id,
            'filiere_id' => $niveau->filiere_id,
        ]);

        return response()->json(['data' => $user->load('filiere', 'niveau')]);
    }

    /**
     * Révoquer (délier) le délégué d'une classe : il redevient étudiant.
     */
    public function revokeDelegate(Niveau $niveau, User $user): JsonResponse
    {
        if ((int) $user->niveau_id === (int) $niveau->id && $user->isDelegue()) {
            // L'ex-délégué redevient étudiant mais RESTE élève de sa classe
            // (on conserve niveau_id) : il peut donc être redésigné plus tard.
            $user->update(['role' => User::ROLE_ETUDIANT]);
        }

        return response()->json(['message' => 'Délégué révoqué.']);
    }
}
