<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostComment;
use App\Models\Schedule;
use App\Models\User;
use App\Notifications\AnnoncePubliee;
use App\Services\ExpoPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

/**
 * Espace de discussion COMMUN (interfilière), accessible à tous.
 * - Seuls l'admin et les délégués publient ; les étudiants commentent.
 * - Photo optionnelle (pas de vidéo) ; ciblage optionnel par filière(s) et/ou
 *   niveau (étiquette colorée — tout le monde voit toutes les publications).
 * - L'admin gère l'emploi du temps général épinglé et modère (supprime tout).
 * - Publications purgées au-delà de 30 jours.
 */
class FeedController extends Controller
{
    private const TTL_DAYS = 30;

    /** Supprime les publications expirées (et leurs fichiers image). */
    private function purge(): void
    {
        Post::where('created_at', '<', now()->subDays(self::TTL_DAYS))
            ->chunkById(100, function ($posts) {
                foreach ($posts as $post) {
                    if ($post->image) {
                        Storage::disk('public')->delete($post->image);
                    }
                    $post->delete(); // cascade : commentaires + pivot filières
                }
            });
    }

    public function index(Request $request): JsonResponse
    {
        $this->purge();

        $posts = Post::with([
            'auteur:id,name,role',
            'filieres:id,code,nom,couleur',
            'targetNiveau:id,nom',
            'commentaires' => fn ($q) => $q->with('auteur:id,name,role')->orderBy('created_at'),
        ])->latest()->get();

        $schedule = Schedule::where('scope', Schedule::SCOPE_COMMON)->first();

        $user = $request->user();

        return response()->json([
            'can_post' => in_array($user->role, [User::ROLE_ADMIN, User::ROLE_DELEGUE], true),
            'is_admin' => $user->role === User::ROLE_ADMIN,
            'schedule' => $schedule,
            'posts' => $posts,
            'ttl_days' => self::TTL_DAYS,
        ]);
    }

    public function storePost(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless(
            in_array($user->role, [User::ROLE_ADMIN, User::ROLE_DELEGUE], true),
            403,
            'Seuls les administrateurs et les délégués peuvent publier.'
        );

        $data = $request->validate([
            'contenu' => ['nullable', 'string', 'max:5000'],
            // Image uniquement (pas de vidéo), jusqu'à 10 Mo.
            'image' => ['nullable', 'image', 'max:10240'],
            'target_filiere_ids' => ['nullable', 'array'],
            'target_filiere_ids.*' => ['integer', 'exists:filieres,id'],
            'target_niveau_id' => ['nullable', 'integer', 'exists:niveaux,id'],
        ]);

        if (empty($data['contenu']) && ! $request->hasFile('image')) {
            return response()->json([
                'message' => 'Ajoutez un texte ou une photo.',
                'errors' => ['contenu' => ['Le message ne peut pas être vide.']],
            ], 422);
        }

        $imagePath = $request->hasFile('image')
            ? $request->file('image')->store('posts', 'public')
            : null;

        $post = Post::create([
            'user_id' => $user->id,
            'contenu' => $data['contenu'] ?? null,
            'image' => $imagePath,
            'target_niveau_id' => $data['target_niveau_id'] ?? null,
        ]);

        if (! empty($data['target_filiere_ids'])) {
            $post->filieres()->sync(array_values(array_unique($data['target_filiere_ids'])));
        }

        $post->load([
            'auteur:id,name,role',
            'filieres:id,code,nom,couleur',
            'targetNiveau:id,nom',
            'commentaires.auteur:id,name,role',
        ]);

        $this->notifyAnnonce($post, $user, $data['target_filiere_ids'] ?? [], $data['target_niveau_id'] ?? null);

        return response()->json(['data' => $post], 201);
    }

    /**
     * Notifie les destinataires d'une annonce : tout le monde si aucune filière
     * n'est ciblée, sinon les utilisateurs des filières (et niveau) ciblés.
     */
    private function notifyAnnonce(Post $post, User $author, array $filiereIds, $niveauId): void
    {
        try {
            $query = User::where('id', '!=', $author->id);
            if (! empty($filiereIds)) {
                $query->whereIn('filiere_id', $filiereIds);
                if ($niveauId) {
                    $query->where('niveau_id', $niveauId);
                }
            }
            $recipients = $query->get();
            if ($recipients->isEmpty()) {
                return;
            }

            $extrait = $post->contenu
                ? mb_strimwidth($post->contenu, 0, 80, '…')
                : 'a partagé une photo';
            $message = "{$author->name} — annonce : {$extrait}";

            Notification::send($recipients, new AnnoncePubliee($post, $message));
            ExpoPushService::send(
                $recipients->pluck('expo_push_token')->all(),
                'Nouvelle annonce',
                $message,
                ['post_id' => $post->id, 'link' => 'annonces']
            );
        } catch (\Throwable $e) {
            Log::warning('Notification annonce echouee : '.$e->getMessage());
        }
    }

    /** Suppression : l'admin modère tout ; l'auteur supprime sa publication. */
    public function destroyPost(Request $request, Post $post): JsonResponse
    {
        $user = $request->user();
        $canDelete = $user->role === User::ROLE_ADMIN || (int) $post->user_id === (int) $user->id;
        abort_unless($canDelete, 403, 'Accès interdit.');

        if ($post->image) {
            Storage::disk('public')->delete($post->image);
        }
        $post->delete();

        return response()->json(['message' => 'Publication supprimée.']);
    }

    public function storeComment(Request $request, Post $post): JsonResponse
    {
        $data = $request->validate([
            'contenu' => ['required', 'string', 'max:2000'],
        ]);

        $comment = $post->commentaires()->create([
            'user_id' => $request->user()->id,
            'contenu' => $data['contenu'],
        ]);
        $comment->load('auteur:id,name,role');

        return response()->json(['data' => $comment], 201);
    }

    /** Suppression d'un commentaire : l'auteur ou l'admin. */
    public function destroyComment(Request $request, PostComment $comment): JsonResponse
    {
        $user = $request->user();
        $canDelete = $user->role === User::ROLE_ADMIN || (int) $comment->user_id === (int) $user->id;
        abort_unless($canDelete, 403, 'Accès interdit.');

        $comment->delete();

        return response()->json(['message' => 'Commentaire supprimé.']);
    }

    /**
     * Emploi du temps GÉNÉRAL de l'espace commun (épinglé). Admin seul.
     */
    public function upsertSchedule(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === User::ROLE_ADMIN, 403, 'Réservé à l\'administration.');

        $data = $request->validate([
            'titre' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'fichier' => ['nullable', 'file', 'max:51200'],
        ]);

        $schedule = Schedule::firstOrNew([
            'scope' => Schedule::SCOPE_COMMON,
            'niveau_id' => null,
        ]);

        $schedule->titre = $data['titre'] ?? $schedule->titre ?? 'Emploi du temps général';
        $schedule->description = $data['description'] ?? $schedule->description;
        $schedule->updated_by = $user->id;

        if ($request->hasFile('fichier')) {
            if ($schedule->chemin_fichier) {
                Storage::disk('public')->delete($schedule->chemin_fichier);
            }
            $file = $request->file('fichier');
            $schedule->chemin_fichier = $file->store('emplois-temps', 'public');
            $schedule->type_fichier = $this->resolveType($file->getClientOriginalExtension());
            $schedule->taille_fichier = $file->getSize();
        }

        $schedule->save();

        return response()->json(['data' => $schedule], $schedule->wasRecentlyCreated ? 201 : 200);
    }

    public function destroySchedule(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === User::ROLE_ADMIN, 403, 'Réservé à l\'administration.');

        $schedule = Schedule::where('scope', Schedule::SCOPE_COMMON)->first();
        if ($schedule) {
            if ($schedule->chemin_fichier) {
                Storage::disk('public')->delete($schedule->chemin_fichier);
            }
            $schedule->delete();
        }

        return response()->json(['message' => 'Emploi du temps supprimé.']);
    }

    private function resolveType(string $extension): string
    {
        $extension = strtolower($extension);

        return match (true) {
            $extension === 'pdf' => 'pdf',
            in_array($extension, ['doc', 'docx', 'odt', 'rtf']) => 'docx',
            in_array($extension, ['ppt', 'pptx', 'odp']) => 'pptx',
            in_array($extension, ['xls', 'xlsx', 'ods', 'csv']) => 'xlsx',
            in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic']) => 'image',
            default => 'autre',
        };
    }
}
