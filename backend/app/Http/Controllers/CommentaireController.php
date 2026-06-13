<?php

namespace App\Http\Controllers;

use App\Models\Activite;
use App\Models\Commentaire;
use App\Models\Ressource;
use App\Models\User;
use App\Notifications\CommentairePublie;
use App\Services\ExpoPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

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

        // Trace l'activité « commentaire » (origine web/mobile via X-Platform).
        try {
            Activite::create([
                'type' => Activite::TYPE_COMMENT,
                'plateforme' => Activite::normalisePlateforme($request->header('X-Platform')),
                'user_id' => $request->user()->id,
                'ressource_id' => $ressource->id,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Trace activite commentaire echouee : '.$e->getMessage());
        }

        // --- Notifier l'auteur de la ressource (délégué) + les admins --------
        // (in-app + email + push), en excluant l'auteur du commentaire.
        try {
            $user = $request->user();
            $ressource->loadMissing('auteur');

            $recipients = collect();
            if ($ressource->auteur && (int) $ressource->auteur->id !== (int) $user->id) {
                $recipients->push($ressource->auteur);
            }
            $admins = User::where('role', User::ROLE_ADMIN)
                ->where('id', '!=', $user->id)
                ->get();
            $recipients = $recipients->merge($admins)->unique('id')->values();

            if ($recipients->isNotEmpty()) {
                $extrait = mb_strimwidth($data['contenu'], 0, 120, '…');
                Notification::send($recipients, new CommentairePublie($ressource, $user->name, $extrait));

                ExpoPushService::send(
                    $recipients->pluck('expo_push_token')->all(),
                    'Nouveau commentaire',
                    "{$user->name} : ".$extrait,
                    ['ressource_id' => $ressource->id]
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Notification commentaire echouee : '.$e->getMessage());
        }

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
