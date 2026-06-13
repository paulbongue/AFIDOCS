<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * Emploi du temps épinglé (non éphémère) :
 *   - scope 'class'  : emploi du temps du semestre d'une classe (délégué).
 *   - scope 'common' : emploi du temps général de l'espace commun (admin).
 */
class Schedule extends Model
{
    use HasFactory;

    public const SCOPE_CLASS = 'class';
    public const SCOPE_COMMON = 'common';

    protected $fillable = [
        'scope',
        'niveau_id',
        'titre',
        'description',
        'chemin_fichier',
        'type_fichier',
        'taille_fichier',
        'updated_by',
    ];

    protected $appends = ['url_fichier'];

    public function niveau(): BelongsTo
    {
        return $this->belongsTo(Niveau::class);
    }

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function getUrlFichierAttribute(): ?string
    {
        return $this->chemin_fichier
            ? Storage::disk('public')->url($this->chemin_fichier)
            : null;
    }
}
