<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Évaluation d'un enseignant (module) par un étudiant, selon la grille officielle
 * AFI-L'UE (15 indicateurs notés /20). `note` est la moyenne calculée.
 */
class Evaluation extends Model
{
    protected $fillable = [
        'user_id',
        'matiere_id',
        'filiere_id',
        'niveau_id',
        'annee_academique_id',
        'semestre',
        'enseignant',
        'module_nom',
        'note',
        'reponses',
    ];

    protected function casts(): array
    {
        return [
            'reponses' => 'array',
            'note' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function matiere(): BelongsTo
    {
        return $this->belongsTo(Matiere::class);
    }

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function niveau(): BelongsTo
    {
        return $this->belongsTo(Niveau::class);
    }

    public function annee(): BelongsTo
    {
        return $this->belongsTo(AnneeAcademique::class, 'annee_academique_id');
    }
}
