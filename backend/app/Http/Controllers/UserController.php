<?php

namespace App\Http\Controllers;

use App\Models\Niveau;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::with(['filiere:id,code,nom,couleur', 'niveau:id,nom,filiere_id'])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'filiere_id', 'niveau_id']);

        return response()->json(['data' => $users]);
    }

    /**
     * Creation de compte par l'Admin. Pour un Delegue, filiere_id est obligatoire.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', Rule::in([User::ROLE_ADMIN, User::ROLE_DELEGUE, User::ROLE_ETUDIANT])],
            'filiere_id' => ['nullable', 'integer', 'exists:filieres,id'],
            'niveau_id' => ['nullable', 'integer', 'exists:niveaux,id'],
        ]);

        // Regle metier : un Delegue est propre a une CLASSE (niveau).
        if ($data['role'] === User::ROLE_DELEGUE && empty($data['niveau_id'])) {
            return response()->json([
                'message' => 'Un delegue doit etre rattache a une classe (niveau).',
                'errors' => ['niveau_id' => ['La classe est obligatoire pour un delegue.']],
            ], 422);
        }

        // La filiere est deduite de la classe (niveau) lorsqu'elle est fournie.
        if (! empty($data['niveau_id'])) {
            $data['filiere_id'] = Niveau::findOrFail($data['niveau_id'])->filiere_id;
        }

        $user = User::create($data);

        return response()->json(['data' => $user->load('filiere', 'niveau')], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:6'],
            'role' => ['sometimes', Rule::in([User::ROLE_ADMIN, User::ROLE_DELEGUE, User::ROLE_ETUDIANT])],
            'filiere_id' => ['nullable', 'integer', 'exists:filieres,id'],
            'niveau_id' => ['nullable', 'integer', 'exists:niveaux,id'],
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        // La filiere suit la classe (niveau) lorsqu'elle est fournie.
        if (! empty($data['niveau_id'])) {
            $data['filiere_id'] = Niveau::findOrFail($data['niveau_id'])->filiere_id;
        }

        $user->update($data);

        return response()->json(['data' => $user->load('filiere', 'niveau')]);
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json(['message' => 'Utilisateur supprime.']);
    }
}
