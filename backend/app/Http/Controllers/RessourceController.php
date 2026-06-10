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
            'matiere_id' => ['required', 'integer', 'exists:matieres,id'],
            'fichier' => ['required', 'file', 'max:51200', // 50 Mo
                'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png,mp4'],
        ]);

        $matiere = Matiere::with('niveau')->findOrFail($data['matiere_id']);

        // Controle serveur : le Delegue ne publie que dans sa filiere (403 sinon).
        if ($request->user()->cannot('publishInMatiere', [Ressource::class, $matiere])) {
            return response()->json(['message' => 'Acces interdit.'], 403);
        }

        $file = $request->file('fichier');
        $path = $file->store('ressources', 'public');

        $ressource = Ressource::create([
            'titre' => $data['titre'],
            'description' => $data['description'] ?? null,
            'type_fichier' => $this->resolveType($file->getClientOriginalExtension()),
            'chemin_fichier' => $path,
            'taille_fichier' => $file->getSize(),
            'matiere_id' => $matiere->id,
            'user_id' => $request->user()->id,
        ]);

        $ressource->load([
            'auteur:id,name,role',
            'matiere.niveau.filiere:id,code,nom,couleur',
        ]);

        // --- Notifier les etudiants de la filiere (in-app + email + push) ----
        try {
            $matiere->loadMissing('niveau.filiere');
            $filiere = $matiere->niveau?->filiere;

            if ($filiere) {
                $etudiants = \App\Models\User::where('role', \App\Models\User::ROLE_ETUDIANT)
                    ->where('filiere_id', $filiere->id)
                    ->get();

                if ($etudiants->isNotEmpty()) {
                    \Illuminate\Support\Facades\Notification::send(
                        $etudiants,
                        new \App\Notifications\RessourcePubliee(
                            $ressource, $filiere->code, $filiere->nom, $matiere->nom
                        )
                    );

                    \App\Services\ExpoPushService::send(
                        $etudiants->pluck('expo_push_token')->all(),
                        "Nouvelle ressource — {$filiere->code}",
                        $ressource->titre,
                        ['ressource_id' => $ressource->id]
                    );
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Notification publication echouee : '.$e->getMessage());
        }

        return response()->json(['data' => $ressource], 201);
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
            in_array($extension, ['doc', 'docx']) => 'docx',
            in_array($extension, ['ppt', 'pptx']) => 'pptx',
            in_array($extension, ['xls', 'xlsx']) => 'xlsx',
            in_array($extension, ['jpg', 'jpeg', 'png']) => 'image',
            $extension === 'mp4' => 'video',
            default => 'autre',
        };
    }
}
