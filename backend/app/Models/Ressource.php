<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

/**
 * Classe centrale et la plus riche du systeme.
 * NB : aucune colonne `statut` -> toute ressource creee est immediatement
 * publiee et accessible (choix de conception : publication directe).
 */
class Ressource extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre',
        'description',
        'type_fichier',
        'chemin_fichier',
        'taille_fichier',
        'matiere_id',
        'user_id',
    ];

    protected $appends = ['url_fichier'];

    public function matiere(): BelongsTo
    {
        return $this->belongsTo(Matiere::class);
    }

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function commentaires(): HasMany
    {
        return $this->hasMany(Commentaire::class);
    }

    /**
     * URL publique absolue du fichier (utilisee par l'app pour le telechargement).
     */
    public function getUrlFichierAttribute(): ?string
    {
        return $this->chemin_fichier
            ? Storage::disk('public')->url($this->chemin_fichier)
            : null;
    }
}
