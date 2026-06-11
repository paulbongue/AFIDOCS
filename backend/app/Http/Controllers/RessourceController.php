<?php

namespace App\Http\Controllers;

use App\Models\Matiere;
use App\Models\Ressource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RessourceController extends Controller
{
    /**
     * Liste des ressources TOUTES FILIERES (acces libre Etudiant).
     * Aucun filtre filiere_id impose : c'est la fonctionnalite distinctive (H2).
     * Filtres optionnels : search, filiere_id, niveau_id, matiere_id, type_fichier.
     * Param `since` (ISO 8601) : synchronisation incrementale pour l'app offline.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ressource::query()
            ->with([
                'auteur:id,name,role',
                'matiere:id,nom,niveau_id',
                'matiere.niveau:id,nom,filiere_id',
                'matiere.niveau.filiere:id,code,nom,couleur',
            ])
            ->withCount('commentaires');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('titre', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($type = $request->query('type_fichier')) {
            $query->where('type_fichier', $type);
        }

        // Filtres hierarchiques via la chaine matiere -> niveau -> filiere.
        if ($matiereId = $request->query('matiere_id')) {
            $query->where('matiere_id', $matiereId);
        }

        if ($niveauId = $request->query('niveau_id')) {
            $query->whereHas('matiere', fn ($q) => $q->where('niveau_id', $niveauId));
        }

        if ($filiereId = $request->query('filiere_id')) {
            $query->whereHas('matiere.niveau', fn ($q) => $q->where('filiere_id', $filiereId));
        }

        // Synchronisation incrementale : ne renvoyer que les ressources modifiees.
        if ($since = $request->query('since')) {
            $query->where('updated_at', '>', $since);
        }

        $ressources = $query->latest('updated_at')->get();

        return response()->json([
            'data' => $ressources,
            'server_time' => now()->toIso8601String(),
        ]);
    }

    public function show(Ressource $ressource): JsonResponse
    {
        $ressource->load([
            'auteur:id,name,role',
            'matiere:id,nom,niveau_id',
            'matiere.niveau:id,nom,filiere_id',
            'matiere.niveau.filiere:id,code,nom,couleur',
            'commentaires.auteur:id,name,role',
        ]);

        return response()->json(['data' => $ressource]);
    }

    /**
     * Publication directe par le Delegue (sans validation Admin).
     * La Policy filiere verifie cote serveur que la matiere appartient a sa filiere.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'titre' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'matiere_id' => ['nullable', 'integer', 'exists:matieres,id'],
            'matiere_ids' => ['nullable', 'array'],
            'matiere_ids.*' => ['integer', 'exists:matieres,id'],
            // Tout type de document accepte (jusqu'a 50 Mo).
            'fichier' => ['required', 'file', 'max:51200'],
        ]);

        // Cibles : une OU plusieurs matieres (classes/filieres partageant le cours).
        $targets = ! empty($data['matiere_ids'])
            ? array_values(array_unique($data['matiere_ids']))
            : (! empty($data['matiere_id']) ? [$data['matiere_id']] : []);

        if (empty($targets)) {
            return response()->json([
                'message' => 'Selectionne au moins une matiere.',
                'errors' => ['matiere_id' => ['Au moins une matiere est requise.']],
            ], 422);
        }

        $matieres = Matiere::with('niveau.filiere')->whereIn('id', $targets)->get();

        // Coherence : une publication multi-cibles ne vise que des classes du MEME
        // niveau (seules les filieres de meme niveau partagent un cours commun).
        if ($matieres->pluck('niveau.nom')->unique()->count() > 1) {
            return response()->json([
                'message' => 'Toutes les classes choisies doivent etre du meme niveau.',
            ], 422);
        }

        // Il faut le droit de publier dans CHAQUE matiere ciblee.
        foreach ($matieres as $m) {
            if ($request->user()->cannot('publishInMatiere', [Ressource::class, $m])) {
                return response()->json(['message' => 'Acces interdit pour une des filieres choisies.'], 403);
            }
        }

        $file = $request->file('fichier');
        $type = $this->resolveType($file->getClientOriginalExtension());
        $size = $file->getSize();
        $basePath = $file->store('ressources', 'public');

        $created = [];
        foreach ($matieres as $i => $m) {
            // 1re cible : on reutilise le fichier stocke ; suivantes : une copie.
            $path = $i === 0 ? $basePath : $this->duplicateStored($basePath);

            $ressource = Ressource::create([
                'titre' => $data['titre'],
                'description' => $data['description'] ?? null,
                'type_fichier' => $type,
                'chemin_fichier' => $path,
                'taille_fichier' => $size,
                'matiere_id' => $m->id,
                'user_id' => $request->user()->id,
            ]);
            $ressource->load(['auteur:id,name,role', 'matiere.niveau.filiere:id,code,nom,couleur']);

            $this->notifyPublication($ressource, $m, $request->user());
            $created[] = $ressource;
        }

        return response()->json([
            'data' => count($created) === 1 ? $created[0] : $created,
            'count' => count($created),
        ], 201);
    }

    // Duplique un fichier deja stocke (publication multi-filieres).
    private function duplicateStored(string $path): string
    {
        $disk = \Illuminate\Support\Facades\Storage::disk('public');
        $ext = pathinfo($path, PATHINFO_EXTENSION);
        $new = 'ressources/'.\Illuminate\Support\Str::random(40).($ext ? '.'.$ext : '');
        $disk->copy($path, $new);

        return $new;
    }

    // Notifie les etudiants de la filiere + les admins (in-app + email + push).
    private function notifyPublication(Ressource $ressource, Matiere $matiere, $author): void
    {
        try {
            $matiere->loadMissing('niveau.filiere');
            $filiere = $matiere->niveau?->filiere;
            if (! $filiere) {
                return;
            }

            $recipients = \App\Models\User::where('id', '!=', $author->id)
                ->where(function ($q) use ($filiere) {
                    $q->where(function ($qq) use ($filiere) {
                        $qq->where('role', \App\Models\User::ROLE_ETUDIANT)
                           ->where('filiere_id', $filiere->id);
                    })->orWhere('role', \App\Models\User::ROLE_ADMIN);
                })
                ->get();

            if ($recipients->isNotEmpty()) {
                \Illuminate\Support\Facades\Notification::send(
                    $recipients,
                    new \App\Notifications\RessourcePubliee($ressource, $filiere->code, $filiere->nom, $matiere->nom)
                );
                \App\Services\ExpoPushService::send(
                    $recipients->pluck('expo_push_token')->all(),
                    "Nouvelle ressource — {$filiere->code}",
                    $ressource->titre,
                    ['ressource_id' => $ressource->id]
                );
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Notification publication echouee : '.$e->getMessage());
        }
    }

    public function update(Request $request, Ressource $ressource): JsonResponse
    {
        if ($request->user()->cannot('update', $ressource)) {
            return response()->json(['message' => 'Acces interdit.'], 403);
        }

        $data = $request->validate([
            'titre' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $ressource->update($data);

        return response()->json(['data' => $ressource]);
    }

    public function destroy(Request $request, Ressource $ressource): JsonResponse
    {
        if ($request->user()->cannot('delete', $ressource)) {
            return response()->json(['message' => 'Acces interdit.'], 403);
        }

        if ($ressource->chemin_fichier) {
            Storage::disk('public')->delete($ressource->chemin_fichier);
        }
        $ressource->delete();

        return response()->json(['message' => 'Ressource supprimee.']);
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
            in_array($extension, ['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v']) => 'video',
            default => 'autre',
        };
    }
}
