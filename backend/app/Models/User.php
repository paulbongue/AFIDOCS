<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Classe centrale du systeme d'authentification.
 * role : admin | delegue | etudiant
 * filiere_id : NULL pour Admin/Etudiant, OBLIGATOIRE pour Delegue.
 *   -> pivot du mecanisme de securite (Policy filiere).
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_ADMIN = 'admin';
    public const ROLE_DELEGUE = 'delegue';
    public const ROLE_ETUDIANT = 'etudiant';

    protected $fillable = [
        'name',
        'email',
        'contact_email',
        'password',
        'must_change_password',
        'role',
        'filiere_id',
        'niveau_id',
        'expo_push_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'otp_code_hash',
        'contact_email_code_hash',
        'contact_email_pending',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
            'otp_expires_at' => 'datetime',
            'otp_last_sent_at' => 'datetime',
            'contact_email_code_expires_at' => 'datetime',
        ];
    }

    // -------------------------------------------------------------------
    // Relations Eloquent
    // -------------------------------------------------------------------

    public function ressources(): HasMany
    {
        return $this->hasMany(Ressource::class);
    }

    public function commentaires(): HasMany
    {
        return $this->hasMany(Commentaire::class);
    }

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    /**
     * Classe du délégué (= niveau précis d'une filière).
     */
    public function niveau(): BelongsTo
    {
        return $this->belongsTo(Niveau::class);
    }

    /**
     * Appareils mémorisés (« se souvenir de cet appareil ») pour l'OTP.
     */
    public function trustedDevices(): HasMany
    {
        return $this->hasMany(TrustedDevice::class);
    }

    // -------------------------------------------------------------------
    // Helpers de role
    // -------------------------------------------------------------------

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isDelegue(): bool
    {
        return $this->role === self::ROLE_DELEGUE;
    }

    public function isEtudiant(): bool
    {
        return $this->role === self::ROLE_ETUDIANT;
    }
}
