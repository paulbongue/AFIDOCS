<?php

namespace App\Http\Controllers;

use App\Mail\WelcomeStudentMail;
use App\Models\Filiere;
use App\Models\Niveau;
use App\Models\User;
use App\Notifications\NouveauMembre;
use App\Services\ExpoPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
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
            // E-mail RÉEL (facultatif) : sert à l'envoi automatique de l'e-mail de bienvenue
            // et de sécurité (OTP). Distinct de l'identifiant de connexion généré.
            'email_contact' => ['nullable', 'email:rfc'],
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

        // E-mail réel fourni : envoi automatique de l'e-mail de bienvenue et
        // pré-enregistrement de l'adresse de sécurité (à confirmer en un clic).
        if (! empty($data['email_contact'])) {
            $this->sendWelcome($user, Str::lower($data['email_contact']), $data['password']);
        }

        return response()->json(['data' => $user->load('filiere', 'niveau')], 201);
    }

    /**
     * Import en masse d'étudiants via un CSV (colonnes : prénom, nom, email,
     * filière, niveau). Mot de passe par défaut commun + changement forcé à la
     * 1re connexion + e-mail de bienvenue automatique si une adresse est fournie.
     */
    public function importCsv(Request $request): JsonResponse
    {
        $request->validate([
            'fichier' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $lines = array_values(array_filter(array_map('trim', file($request->file('fichier')->getRealPath()))));
        if (count($lines) < 2) {
            return response()->json(['message' => 'Fichier CSV vide ou sans données.'], 422);
        }

        // Séparateur : « ; » (Excel FR) ou « , ».
        $sep = substr_count($lines[0], ';') >= substr_count($lines[0], ',') ? ';' : ',';
        $headers = array_map(fn ($h) => $this->normKey($h), str_getcsv($lines[0], $sep));

        $defaultPassword = 'Afi@2026';
        $created = 0;
        $errors = [];

        foreach (array_slice($lines, 1) as $idx => $line) {
            $num = $idx + 2; // n° de ligne dans le fichier (1 = en-tête)
            $cols = str_getcsv($line, $sep);
            $cols = array_slice(array_pad($cols, count($headers), null), 0, count($headers));
            $row = array_combine($headers, $cols);

            $prenom = trim($row['prenom'] ?? '');
            $nom = trim($row['nom'] ?? '');
            $email = trim($row['email'] ?? ($row['mail'] ?? ''));
            $filiereKey = trim($row['filiere'] ?? '');
            $niveauKey = trim($row['niveau'] ?? '');

            if ($prenom === '' || $nom === '') { $errors[] = "Ligne {$num} : prénom/nom manquant."; continue; }

            $filiere = Filiere::whereRaw('UPPER(code) = ?', [strtoupper($filiereKey)])
                ->orWhereRaw('LOWER(nom) = ?', [mb_strtolower($filiereKey)])->first();
            if (! $filiere) { $errors[] = "Ligne {$num} : filière « {$filiereKey} » introuvable."; continue; }

            $niveau = Niveau::where('filiere_id', $filiere->id)
                ->whereRaw('UPPER(nom) = ?', [strtoupper($niveauKey)])->first();
            if (! $niveau) { $errors[] = "Ligne {$num} : niveau « {$niveauKey} » introuvable dans {$filiere->code}."; continue; }

            if ($email !== '' && ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors[] = "Ligne {$num} : e-mail invalide."; continue;
            }

            $user = User::create([
                'name' => trim("{$prenom} {$nom}"),
                'email' => $this->generateEmail($prenom, $nom, $filiere, $niveau),
                'password' => $defaultPassword,
                'must_change_password' => true,
                'role' => User::ROLE_ETUDIANT,
                'filiere_id' => $filiere->id,
                'niveau_id' => $niveau->id,
            ]);

            if ($email !== '') {
                $this->sendWelcome($user, Str::lower($email), $defaultPassword);
            }
            $created++;
        }

        return response()->json([
            'message' => "{$created} compte(s) créé(s).",
            'created' => $created,
            'errors' => $errors,
            'default_password' => $defaultPassword,
        ]);
    }

    /** Normalise un en-tête de colonne (minuscule, sans accent ni ponctuation). */
    private function normKey(string $h): string
    {
        $h = mb_strtolower(trim($h));
        $h = strtr($h, ['é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e', 'à' => 'a', 'â' => 'a',
            'î' => 'i', 'ï' => 'i', 'ô' => 'o', 'û' => 'u', 'ù' => 'u', 'ç' => 'c']);
        return preg_replace('/[^a-z]/', '', $h);
    }

    /**
     * Notifie les membres existants d'une classe (étudiants + délégué) qu'un
     * nouvel utilisateur vient d'y être ajouté. Cloche in-app + push.
     */
    /**
     * Envoie l'e-mail de bienvenue (identifiant + mot de passe + confirmation) et
     * pré-enregistre l'adresse comme e-mail de sécurité EN ATTENTE. Comme le code
     * de confirmation est laissé à null, l'étudiant pourra la confirmer en UN CLIC
     * une fois connecté (l'adresse a été fournie par l'administration).
     */
    private function sendWelcome(User $user, string $email, string $plainPassword): void
    {
        try {
            $user->forceFill([
                'contact_email_pending' => $email,
                'contact_email_code_hash' => null,
                'contact_email_code_expires_at' => null,
            ])->save();

            Mail::to($email)->send(new WelcomeStudentMail(
                $user->name ?: 'étudiant',
                $user->email,
                $plainPassword,
            ));
        } catch (\Throwable $e) {
            Log::warning('E-mail de bienvenue échoué : '.$e->getMessage());
        }
    }

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
