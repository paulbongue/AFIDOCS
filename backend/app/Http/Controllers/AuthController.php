<?php

namespace App\Http\Controllers;

use App\Mail\OtpCodeMail;
use App\Models\TrustedDevice;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Connexion : verifie l'email + mot de passe (bcrypt) et renvoie un token Sanctum.
     * Le token est ensuite stocke par l'app et injecte en header Authorization: Bearer.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string'],
            // Jeton d'appareil de confiance (« se souvenir de cet appareil »).
            'device_token' => ['nullable', 'string'],
        ]);

        // Verrouillage anti-force-brute PAR COMPTE (en plus du throttle par IP) :
        // cible une seule adresse e-mail depuis une même origine, ce qui bloque
        // les attaques par dictionnaire sur un compte précis. Clé = email + IP.
        $throttleKey = Str::lower($credentials['email']).'|'.$request->ip();
        $maxTentatives = 5;

        if (RateLimiter::tooManyAttempts($throttleKey, $maxTentatives)) {
            $secondes = RateLimiter::availableIn($throttleKey);
            $minutes = (int) ceil($secondes / 60);
            throw ValidationException::withMessages([
                'email' => ["Trop de tentatives de connexion. Réessayez dans environ {$minutes} minute(s)."],
            ])->status(429);
        }

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            // Échec : on incrémente le compteur (fenêtre glissante de 5 minutes).
            RateLimiter::hit($throttleKey, 300);
            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects.'],
            ]);
        }

        // Connexion réussie : on remet le compteur d'échecs à zéro.
        RateLimiter::clear($throttleKey);

        $deviceName = $credentials['device_name'] ?? $request->userAgent() ?? 'mobile';

        // --- Double authentification (OTP) ----------------------------------
        // L'OTP ne s'applique QUE si l'utilisateur a une adresse e-mail de
        // sécurité confirmée (sinon le code n'irait nulle part → blocage).
        // On saute aussi l'OTP si l'appareil est déjà « de confiance ».
        if (config('otp.enabled')
            && $user->contact_email
            && ! $this->deviceIsTrusted($user, $credentials['device_token'] ?? null)) {
            $this->sendOtp($user);

            return response()->json([
                'otp_required' => true,
                'email' => $this->maskEmail($user->contact_email),
                'message' => 'Un code de vérification a été envoyé à votre adresse e-mail de sécurité.',
            ]);
        }

        // Pas d'OTP (désactivé ou appareil de confiance) : session ouverte direct.
        return response()->json($this->issueTokenResponse($user, $deviceName));
    }

    /**
     * Étape 2 de la connexion : vérifie le code OTP reçu par e-mail, ouvre la
     * session (token Sanctum) et, en option, mémorise l'appareil (30 jours).
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string'],
            'device_name' => ['nullable', 'string'],
            'remember_device' => ['nullable', 'boolean'],
        ]);

        $user = User::where('email', $data['email'])->first();

        // Message volontairement générique (ne révèle pas si le compte existe).
        $invalide = fn () => throw ValidationException::withMessages([
            'code' => ['Code invalide ou expiré. Redemandez un nouveau code.'],
        ]);

        if (! $user || ! $user->otp_code_hash || ! $user->otp_expires_at) {
            $invalide();
        }

        // Code expiré : on nettoie et on refuse.
        if (now()->greaterThan($user->otp_expires_at)) {
            $this->clearOtp($user);
            $invalide();
        }

        // Trop d'essais sur ce code : on l'invalide et on force un renvoi.
        if ($user->otp_attempts >= (int) config('otp.max_attempts')) {
            $this->clearOtp($user);
            throw ValidationException::withMessages([
                'code' => ['Trop d\'essais. Un nouveau code est nécessaire.'],
            ]);
        }

        if (! Hash::check($data['code'], $user->otp_code_hash)) {
            $user->increment('otp_attempts');
            throw ValidationException::withMessages([
                'code' => ['Code incorrect.'],
            ]);
        }

        // Code correct : on l'invalide immédiatement (usage unique).
        $this->clearOtp($user);

        $deviceName = $data['device_name'] ?? $request->userAgent() ?? 'mobile';
        $payload = $this->issueTokenResponse($user, $deviceName);

        // « Se souvenir de cet appareil » : on émet un jeton d'appareil de
        // confiance (stocké haché) que le client renverra aux prochaines connexions.
        if (! empty($data['remember_device'])) {
            $payload['device_token'] = $this->rememberDevice($user, $deviceName);
        }

        return response()->json($payload);
    }

    /**
     * Renvoi d'un nouveau code OTP (avec délai anti-spam).
     */
    public function resendOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $data['email'])->first();

        // Réponse identique quoi qu'il arrive (pas de fuite d'information).
        $ok = response()->json([
            'message' => 'Si un code était en attente, un nouveau vient d\'être envoyé.',
        ]);

        if (! $user) {
            return $ok;
        }

        $cooldown = (int) config('otp.resend_cooldown_seconds');
        if ($user->otp_last_sent_at) {
            $ecoule = now()->getTimestamp() - $user->otp_last_sent_at->getTimestamp();
            if ($ecoule < $cooldown) {
                $reste = $cooldown - $ecoule;
                throw ValidationException::withMessages([
                    'code' => ["Veuillez patienter {$reste} seconde(s) avant de redemander un code."],
                ])->status(429);
            }
        }

        $this->sendOtp($user);

        return $ok;
    }

    /**
     * Connexion « Se connecter avec Google ».
     * Le client (web ou mobile) obtient un ID token Google, on le vérifie ici,
     * puis on ouvre la session UNIQUEMENT si l'adresse Google (vérifiée) correspond
     * à l'adresse e-mail de sécurité d'un compte existant. Sinon : accès refusé.
     * Google faisant office de 2e facteur, on ne redemande pas d'OTP.
     */
    public function googleLogin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_token' => ['required', 'string'],
            'device_name' => ['nullable', 'string'],
        ]);

        // Vérification de l'ID token auprès de Google (signature + expiration).
        $resp = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $data['id_token'],
        ]);

        $refus = fn ($msg) => throw ValidationException::withMessages(['email' => [$msg]]);

        if (! $resp->ok()) {
            $refus('Jeton Google invalide ou expiré. Réessayez.');
        }

        $payload = $resp->json();
        $expectedAud = config('services.google.client_id');

        if (! $expectedAud || ($payload['aud'] ?? null) !== $expectedAud) {
            $refus('Ce jeton Google ne provient pas de cette application.');
        }

        $emailVerified = $payload['email_verified'] ?? false;
        $verified = $emailVerified === true || $emailVerified === 'true';
        $email = Str::lower($payload['email'] ?? '');

        if (! $verified || ! $email) {
            $refus('Adresse Google non vérifiée.');
        }

        // Correspondance avec l'adresse e-mail de SÉCURITÉ d'un compte existant.
        $user = User::whereRaw('LOWER(contact_email) = ?', [$email])->first();

        if (! $user) {
            $refus("Compte non reconnu : l'adresse « {$email} » n'est associée à aucun compte AFI-DOCS. "
                .'Ajoutez-la d\'abord dans votre profil (E-mail de sécurité).');
        }

        $deviceName = $data['device_name'] ?? $request->userAgent() ?? 'google';

        // Google a authentifié l'utilisateur : session ouverte sans OTP.
        return response()->json($this->issueTokenResponse($user, $deviceName));
    }

    /**
     * Profil de l'utilisateur connecte (utilise au demarrage de l'app).
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('filiere', 'niveau');

        return response()->json(['user' => $this->userPayload($user)]);
    }

    /**
     * Deconnexion : revoque le token courant.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Deconnecte.']);
    }

    /**
     * Deconnecte tous les AUTRES appareils (revoque tous les jetons sauf celui
     * de la requete en cours).
     */
    public function logoutOtherDevices(Request $request): JsonResponse
    {
        $current = $request->user()->currentAccessToken();
        $count = $request->user()->tokens()->where('id', '!=', $current->id)->count();
        $request->user()->tokens()->where('id', '!=', $current->id)->delete();

        return response()->json([
            'message' => 'Deconnecte des autres appareils.',
            'revoked' => $count,
        ]);
    }

    /**
     * Modification du mot de passe par l'utilisateur connecte.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        $user->update(['password' => $data['password']]);

        return response()->json(['message' => 'Mot de passe mis a jour.']);
    }

    /**
     * Enregistre (ou efface) le jeton de push Expo de l'appareil mobile.
     */
    public function updatePushToken(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['nullable', 'string', 'max:255'],
        ]);

        $request->user()->update(['expo_push_token' => $data['token'] ?? null]);

        return response()->json(['message' => 'Jeton push enregistre.']);
    }

    /**
     * Étape 1 — l'utilisateur saisit son adresse e-mail de SÉCURITÉ (réelle) :
     * on la met « en attente » et on envoie un code de confirmation À CETTE
     * adresse. Elle ne devient active qu'après confirmation (protège contre les
     * fautes de frappe qui pourraient verrouiller le compte).
     */
    public function setContactEmail(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email:rfc'],
        ]);

        $user = $request->user();
        $length = (int) config('otp.length', 6);
        $code = (string) random_int((int) str_pad('1', $length, '0'), (int) str_pad('', $length, '9'));

        $user->forceFill([
            'contact_email_pending' => Str::lower($data['email']),
            'contact_email_code_hash' => Hash::make($code),
            'contact_email_code_expires_at' => now()->addMinutes((int) config('otp.ttl_minutes', 10)),
        ])->save();

        Mail::to($data['email'])->send(
            new OtpCodeMail($code, $user->name ?: 'utilisateur', (int) config('otp.ttl_minutes', 10))
        );

        return response()->json([
            'message' => 'Un code de confirmation a été envoyé à cette adresse.',
            'pending' => $this->maskEmail($data['email']),
        ]);
    }

    /**
     * Étape 2 — confirmation de l'adresse e-mail de sécurité avec le code reçu.
     */
    public function confirmContactEmail(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! $user->contact_email_pending || ! $user->contact_email_code_hash
            || ! $user->contact_email_code_expires_at
            || now()->greaterThan($user->contact_email_code_expires_at)) {
            throw ValidationException::withMessages([
                'code' => ['Aucune confirmation en cours ou code expiré. Recommencez.'],
            ]);
        }

        if (! Hash::check($data['code'], $user->contact_email_code_hash)) {
            throw ValidationException::withMessages([
                'code' => ['Code incorrect.'],
            ]);
        }

        $user->forceFill([
            'contact_email' => $user->contact_email_pending,
            'contact_email_pending' => null,
            'contact_email_code_hash' => null,
            'contact_email_code_expires_at' => null,
        ])->save();

        $user->load('filiere', 'niveau');

        return response()->json([
            'message' => 'Adresse e-mail de sécurité confirmée.',
            'user' => $this->userPayload($user),
        ]);
    }

    /**
     * Confirmation EN UN CLIC d'une adresse e-mail de sécurité pré-enregistrée par
     * l'administration (import/création). Autorisée uniquement lorsqu'une adresse
     * est en attente SANS code (donc fournie par l'admin, pas saisie par l'usager).
     */
    public function confirmPendingContactEmail(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->contact_email_pending || $user->contact_email_code_hash) {
            throw ValidationException::withMessages([
                'email' => ['Aucune adresse à confirmer en un clic.'],
            ]);
        }

        $user->forceFill([
            'contact_email' => $user->contact_email_pending,
            'contact_email_pending' => null,
        ])->save();

        $user->load('filiere', 'niveau');

        return response()->json([
            'message' => 'Adresse e-mail de sécurité confirmée.',
            'user' => $this->userPayload($user),
        ]);
    }

    // -------------------------------------------------------------------
    // Helpers OTP / session
    // -------------------------------------------------------------------

    /**
     * Ouvre la session : crée le token Sanctum, applique la limite de 3
     * appareils et renvoie le corps de réponse standard { token, user }.
     */
    private function issueTokenResponse(User $user, string $deviceName): array
    {
        $token = $user->createToken($deviceName)->plainTextToken;

        // Limite à 3 appareils connectés : on ne garde que les 3 jetons les plus
        // récents (le plus ancien est déconnecté au-delà).
        $keep = $user->tokens()->orderByDesc('id')->take(3)->pluck('id');
        $user->tokens()->whereNotIn('id', $keep)->delete();

        $user->load('filiere', 'niveau');

        return [
            'token' => $token,
            'user' => $this->userPayload($user),
        ];
    }

    /**
     * Génère un code OTP, le stocke haché avec une expiration, et l'envoie par
     * e-mail. On ne conserve jamais le code en clair.
     */
    private function sendOtp(User $user): void
    {
        $length = (int) config('otp.length', 6);
        $min = (int) str_pad('1', $length, '0');       // ex. 100000
        $max = (int) str_pad('', $length, '9');        // ex. 999999
        $code = (string) random_int($min, $max);

        $user->forceFill([
            'otp_code_hash' => Hash::make($code),
            'otp_expires_at' => now()->addMinutes((int) config('otp.ttl_minutes', 10)),
            'otp_attempts' => 0,
            'otp_last_sent_at' => now(),
        ])->save();

        // Le code part vers l'adresse de SÉCURITÉ confirmée (repli sur
        // l'identifiant si jamais elle n'est pas définie).
        $destinataire = $user->contact_email ?: $user->email;

        Mail::to($destinataire)->send(
            new OtpCodeMail($code, $user->name ?: 'utilisateur', (int) config('otp.ttl_minutes', 10))
        );
    }

    /**
     * Efface le code OTP en attente (après succès, expiration ou abus).
     */
    private function clearOtp(User $user): void
    {
        $user->forceFill([
            'otp_code_hash' => null,
            'otp_expires_at' => null,
            'otp_attempts' => 0,
        ])->save();
    }

    /**
     * Vérifie qu'un jeton d'appareil correspond à un appareil de confiance
     * encore valide pour cet utilisateur (et rafraîchit sa date d'usage).
     */
    private function deviceIsTrusted(User $user, ?string $deviceToken): bool
    {
        if (! $deviceToken) {
            return false;
        }

        $device = $user->trustedDevices()
            ->where('token_hash', hash('sha256', $deviceToken))
            ->where('expires_at', '>', now())
            ->first();

        if (! $device) {
            return false;
        }

        $device->update(['last_used_at' => now()]);

        return true;
    }

    /**
     * Mémorise l'appareil courant et renvoie le jeton (en clair) à stocker côté
     * client. On ne garde qu'un hash SHA-256 en base.
     */
    private function rememberDevice(User $user, string $deviceName): string
    {
        $plain = Str::random(48);

        // Un peu de ménage : on retire les appareils expirés de ce compte.
        $user->trustedDevices()->where('expires_at', '<=', now())->delete();

        $user->trustedDevices()->create([
            'token_hash' => hash('sha256', $plain),
            'label' => Str::limit($deviceName, 60, ''),
            'expires_at' => now()->addDays((int) config('otp.trusted_days', 30)),
            'last_used_at' => now(),
        ]);

        return $plain;
    }

    /**
     * Masque une adresse e-mail pour l'affichage (ex. jo***@gmail.com).
     */
    private function maskEmail(string $email): string
    {
        [$name, $domain] = array_pad(explode('@', $email, 2), 2, '');
        $visible = mb_substr($name, 0, min(2, mb_strlen($name)));

        return $visible.str_repeat('*', 3).($domain ? '@'.$domain : '');
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'filiere_id' => $user->filiere_id,
            'filiere' => $user->filiere ? [
                'id' => $user->filiere->id,
                'code' => $user->filiere->code,
                'nom' => $user->filiere->nom,
                'couleur' => $user->filiere->couleur,
            ] : null,
            // Classe du délégué (= niveau précis de la filière).
            'niveau_id' => $user->niveau_id,
            'niveau' => $user->niveau ? [
                'id' => $user->niveau->id,
                'nom' => $user->niveau->nom,
            ] : null,
            // Adresse e-mail de sécurité (OTP) : état côté client.
            'contact_email' => $user->contact_email,
            'contact_email_pending' => $user->contact_email_pending
                ? $this->maskEmail($user->contact_email_pending) : null,
            // Adresse pré-enregistrée par l'admin (sans code) → confirmable en un clic.
            'contact_email_awaiting_confirm' => (bool) ($user->contact_email_pending && ! $user->contact_email_code_hash),
            'otp_enabled' => (bool) config('otp.enabled'),
        ];
    }
}
