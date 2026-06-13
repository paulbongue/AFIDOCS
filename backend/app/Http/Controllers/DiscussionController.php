<?php

namespace App\Http\Controllers;

use App\Models\ClassMessage;
use App\Models\Niveau;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Espace de discussion d'une CLASSE (= un niveau d'une filière).
 * - Accessible uniquement aux membres de la classe (étudiants + délégué).
 *   L'admin n'y a PAS accès.
 * - Le délégué de la classe est le seul modérateur (supprime tout message,
 *   gère l'emploi du temps du semestre épinglé).
 * - Les messages sont éphémères : purgés au-delà de 7 jours.
 */
class DiscussionController extends Controller
{
    private const TTL_DAYS = 7;

    /** Vérifie l'appartenance à la classe (sinon 403). Admin exclu. */
    private function ensureMember(Request $request, Niveau $niveau): void
    {
        $user = $request->user();
        $isMember = in_array($user->role, [User::ROLE_ETUDIANT, User::ROLE_DELEGUE], true)
            && (int) $user->niveau_id === (int) $niveau->id;

        abort_unless($isMember, 403, "Cet espace est réservé aux membres de la classe.");
    }

    /** Le délégué de la classe est le modérateur. */
    private function isModerator(Request $request, Niveau $niveau): bool
    {
        $user = $request->user();

        return $user->role === User::ROLE_DELEGUE && (int) $user->niveau_id === (int) $niveau->id;
    }

    /** Supprime les messages expirés de la classe. */
    private function purge(Niveau $niveau): void
    {
        ClassMessage::where('niveau_id', $niveau->id)
            ->where('created_at', '<', now()->subDays(self::TTL_DAYS))
            ->delete();
    }

    /**
     * Fil de la classe : emploi du temps épinglé + messages récents.
     */
    public function index(Request $request, Niveau $niveau): JsonResponse
    {
        $this->ensureMember($request, $niveau);
        $this->purge($niveau);

        $messages = ClassMessage::where('niveau_id', $niveau->id)
            ->with('auteur:id,name,role')
            ->orderBy('created_at')
            ->get();

        $schedule = Schedule::where('scope', Schedule::SCOPE_CLASS)
            ->where('niveau_id', $niveau->id)
            ->first();

        $niveau->loadMissing('filiere:id,code,nom,couleur');

        return response()->json([
            'classe' => [
                'niveau_id' => $niveau->id,
                'niveau' => $niveau->nom,
                'filiere' => $niveau->filiere,
            ],
            'is_moderator' => $this->isModerator($request, $niveau),
            'schedule' => $schedule,
            'messages' => $messages,
            'ttl_days' => self::TTL_DAYS,
        ]);
    }

    public function storeMessage(Request $request, Niveau $niveau): JsonResponse
    {
        $this->ensureMember($request, $niveau);

        $data = $request->validate([
            'contenu' => ['required', 'string', 'max:2000'],
        ]);

        $message = ClassMessage::create([
            'niveau_id' => $niveau->id,
            'user_id' => $request->user()->id,
            'contenu' => $data['contenu'],
        ]);
        $message->load('auteur:id,name,role');

        return response()->json(['data' => $message], 201);
    }

    /**
     * Suppression d'un message : l'auteur supprime le sien ; le délégué de la
     * classe supprime n'importe lequel.
     */
    public function destroyMessage(Request $request, ClassMessage $message): JsonResponse
    {
        $niveau = Niveau::findOrFail($message->niveau_id);
        $this->ensureMember($request, $niveau);

        $user = $request->user();
        $canDelete = (int) $message->user_id === (int) $user->id
            || $this->isModerator($request, $niveau);

        abort_unless($canDelete, 403, "Vous ne pouvez supprimer que vos propres messages.");

        $message->delete();

        return response()->json(['message' => 'Message supprimé.']);
    }

    /**
     * Emploi du temps du SEMESTRE de la classe (épinglé). Délégué seul.
     */
    public function upsertSchedule(Request $request, Niveau $niveau): JsonResponse
    {
        $this->ensureMember($request, $niveau);
        abort_unless($this->isModerator($request, $niveau), 403, 'Seul le délégué peut modifier l\'emploi du temps.');

        $data = $request->validate([
            'titre' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'fichier' => ['nullable', 'file', 'max:51200'],
        ]);

        $schedule = Schedule::firstOrNew([
            'scope' => Schedule::SCOPE_CLASS,
            'niveau_id' => $niveau->id,
        ]);

        $schedule->titre = $data['titre'] ?? $schedule->titre ?? 'Emploi du temps du semestre';
        $schedule->description = $data['description'] ?? $schedule->description;
        $schedule->updated_by = $request->user()->id;

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

    public function destroySchedule(Request $request, Niveau $niveau): JsonResponse
    {
        $this->ensureMember($request, $niveau);
        abort_unless($this->isModerator($request, $niveau), 403, 'Seul le délégué peut supprimer l\'emploi du temps.');

        $schedule = Schedule::where('scope', Schedule::SCOPE_CLASS)
            ->where('niveau_id', $niveau->id)
            ->first();

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
