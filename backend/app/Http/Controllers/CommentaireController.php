<?php

namespace App\Http\Controllers;

use App\Models\Commentaire;
use App\Models\Ressource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentaireController extends Controller
{
    /**
     * Commentaires d'une ressource (inter-filieres, sans contrainte de filiere).
     */
    public function index(Ressource $ressource): JsonResponse
    {
        $commentaires = $ressource->commentaires()
            ->with('auteur:id,name,role')
            ->latest()
            ->get();

        return response()->json(['data' => $commentaires]);
    }

    /**
     * Tout utilisateur authentifie peut commenter toute ressource (H4).
     */
    public function store(Request $request, Ressource $ressource): JsonResponse
    {
        $data = $request->validate([
            'contenu' => ['required', 'string', 'max:2000'],
        ]);

        $commentaire = $ressource->commentaires()->create([
            'contenu' => $data['contenu'],
            'user_id' => $request->user()->id,
        ]);

        $commentaire->load('auteur:id,name,role');

        return response()->json(['data' => $commentaire], 201);
    }

    /**
     * Suppression : l'auteur supprime son commentaire ; l'Admin modere tout.
     */
    public function destroy(Request $request, Commentaire $commentaire): JsonResponse
    {
        $user = $request->user();

        if (! $user->isAdmin() && (int) $commentaire->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Acces interdit.'], 403);
        }

        $commentaire->delete();

        return response()->json(['message' => 'Commentaire supprime.']);
    }
}
