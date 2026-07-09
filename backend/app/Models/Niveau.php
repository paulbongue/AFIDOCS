<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Annee d'etudes au sein d'une filiere (L3, M1, M2).
 */
class Niveau extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'filiere_id',
        'ordre',
    ];

    /** Ordre hiérarchique déduit du nom (L1<L2<L3<M1<M2). */
    public static function ordreForNom(?string $nom): int
    {
        return ['L1' => 1, 'L2' => 2, 'L3' => 3, 'M1' => 4, 'M2' => 5][strtoupper(trim((string) $nom))] ?? 0;
    }

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function matieres(): HasMany
    {
        return $this->hasMany(Matiere::class);
    }
}
