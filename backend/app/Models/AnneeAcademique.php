<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Année académique (ex. « 2025-2026 »). Une seule est « courante » à la fois.
 */
class AnneeAcademique extends Model
{
    protected $table = 'annees_academiques';

    protected $fillable = [
        'libelle',
        'est_courante',
    ];

    protected function casts(): array
    {
        return ['est_courante' => 'boolean'];
    }

    /** L'année académique courante (ou la plus récente à défaut). */
    public static function courante(): ?self
    {
        return static::where('est_courante', true)->first()
            ?? static::orderByDesc('libelle')->first();
    }
}
