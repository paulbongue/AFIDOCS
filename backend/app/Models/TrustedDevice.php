<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Appareil mémorisé après une vérification OTP réussie : tant que le jeton est
 * valide (non expiré), on ne redemande pas de code sur cet appareil.
 */
class TrustedDevice extends Model
{
    protected $fillable = [
        'user_id',
        'token_hash',
        'label',
        'expires_at',
        'last_used_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'last_used_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
