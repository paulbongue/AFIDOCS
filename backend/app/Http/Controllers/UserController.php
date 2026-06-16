<?php

namespace App\Http\Controllers;

use App\Models\Filiere;
use App\Models\Niveau;
use App\Models\User;
use App\Notifications\NouveauMembre;
use App\Services\ExpoPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
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
     * Creation de compte par l'Admin. Saisie prenom + nom ; l'identifiant de
     * connexion (email) est GENERE automatiquement a partir du prenom, du nom,
     * de la filiere et du niveau. Pour un Delegue, la classe est obligatoire.
     */
    public function store(Request $request): JsonResponse
    {
        // Email vide => null (declenche la generation automatique).
        if ($request->input('email') === '') {
            $request->merge(['email' => null]);
        }

        $data = $request->validate([
            'prenom' => ['nullable', 'string', 'max:120'],
            'nom' => ['nullable', 'string', 'max:120'],
            'name' => ['nullable', 'string', 'max:255'],   // compat : nom complet (mobile)
            'email' => ['nullable', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', Rule::in([User::ROLE_ADMIN, User::ROLE_DELEGUE, User::ROLE_ETUDIANT])],
            'filiere_id' => ['nullable', 'integer', 'exists:filieres,id'],
            'niveau_id' => ['nullable', 'integer', 'exists:niveaux,id'],
        ]);

        // Prenom + nom, avec repli sur un "nom complet" si seul `name` est fourni.
        $prenom = trim($data['prenom'] ?? '');
        $nom = trim($data['nom'] ?? '');
        if ($prenom === '' || $nom === '') {
            $full = trim($data['name'] ?? '');
            if ($full === '') {
                return response()->json([
                    'message' => 'Le prenom et le nom sont requis.',
                    'errors' => ['nom' => ['Prenom et nom obligatoires.']],
                ], 422);
            }
            $parts = preg_split('/\s+/', $full, 2);
            $prenom = $prenom !== '' ? $prenom : ($parts[0] ?? $full);
            $nom = $nom !== '' ? $nom : ($parts[1] ?? '');
        }
        $fullName = trim($prenom.' '.$nom);

        // Regle metier : un Delegue est propre a une CLASSE (niveau).
        if ($data['role'] === User::ROLE_DELEGUE && empty($data['niveau_id'])) {
            return response()->json([
                'message' => 'Un delegue doit etre rattache a une classe (niveau).',
                'errors' => ['niveau_id' => ['La classe est obligatoire pour un delegue.']],
            ], 422);
        }

        // La filiere est deduite de la classe (niveau) lorsqu'elle est fournie.
        $niveau = ! empty($data['niveau_id']) ? Niveau::with('filiere')->find($data['niveau_id']) : null;
        $filiere = $niveau?->filiere
            ?? (! empty($data['filiere_id']) ? Filiere::find($data['filiere_id']) : null);

        $email = $data['email'] ?? $this->generateEmail($prenom, $nom, $filiere, $niveau);

        $user = User::create([
            'name' => $fullName,
            'email' => $email,
            'password' => $data['password'],
            'role' => $data['role'],
            'filiere_id' => $filiere?->id,
            'niveau_id' => $niveau?->id,
        ]);

        // Prévient les membres de la classe qu'un nouvel utilisateur les a rejoints.
        if ($niveau && in_array($user->role, [User::ROLE_ETUDIANT, User::ROLE_DELEGUE], true)) {
            $this->notifyNewMember($user, $niveau);
        }

        return response()->json(['data' => $user->load('filiere', 'niveau')], 201);
    }

    /**
     * Notifie les membres existants d'une classe (étudiants + délégué) qu'un
     * nouvel utilisateur vient d'y être ajouté. Cloche in-app + push.
     */
    private function notifyNewMember(User $newUser, Niveau $niveau): void
    {
        try {
            $recipients = User::where('id', '!=', $newUser->id)
                ->whereIn('role', [User::ROLE_ETUDIANT, User::ROLE_DELEGUE])
                ->where('niveau_id', $niveau->id)
                ->get();
            if ($recipients->isEmpty()) {
                return;
            }

            $message = "{$newUser->name} a rejoint votre classe.";
            Notification::send($recipients, new NouveauMembre($niveau->id, $newUser->name, $message));
            ExpoPushService::send(
                $recipients->pluck('expo_push_token')->all(),
                'Nouveau membre dans votre classe',
                $message,
                ['niveau_id' => $niveau->id, 'link' => 'classe']
            );
        } catch (\Throwable $e) {
            Log::warning('Notification nouveau membre echouee : '.$e->getMessage());
        }
    }

    /**
     * Genere un identifiant de connexion unique : prenom.nom[.filiere][.niveau]@afi.sn
     * (accents/espaces retires), avec suffixe numerique en cas de doublon.
     */
    private function generateEmail(string $prenom, string $nom, ?Filiere $filiere, ?Niveau $niveau): string
    {
        $slug = fn ($s) => Str::of($s)->ascii()->lower()->replaceMatches('/[^a-z0-9]+/', '')->value();
        $base = $slug($prenom).'.'.$slug($nom);

        // Candidats du plus simple au plus precis.
        $candidates = [$base];
        if ($filiere) {
            $candidates[] = $base.'.'.$slug($filiere->code);
        }
        if ($filiere && $niveau) {
            $candidates[] = $base.'.'.$slug($filiere->code).'.'.$slug($niveau->nom);
        }

        foreach ($candidates as $stem) {
            $email = $stem.'@afi.sn';
            if (! User::where('email', $email)->exists()) {
                return $email;
            }
        }

        // Sinon, suffixe numerique sur le candidat le plus precis.
        $stem = end($candidates);
        $i = 2;
        do {
            $email = $stem.$i.'@afi.sn';
            $i++;
        } while (User::where('email', $email)->exists());

        return $email;
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
