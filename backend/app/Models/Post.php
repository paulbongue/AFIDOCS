<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

/**
 * Publication de l'espace commun (interfilière). Auteur = admin ou délégué.
 * Photo optionnelle, ciblage optionnel par filières (pivot) et/ou niveau.
 * Purgée au-delà de 30 jours (voir FeedController::purge).
 */
class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'contenu',
        'image',
        'target_niveau_id',
    ];

    protected $appends = ['image_url'];

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function filieres(): BelongsToMany
    {
        return $this->belongsToMany(Filiere::class, 'post_filiere');
    }

    public function targetNiveau(): BelongsTo
    {
        return $this->belongsTo(Niveau::class, 'target_niveau_id');
    }

    /**
     * Niveaux ciblés par l'annonce (ciblage multiple).
     */
    public function niveaux(): BelongsToMany
    {
        return $this->belongsToMany(Niveau::class, 'post_niveau');
    }

    public function commentaires(): HasMany
    {
        return $this->hasMany(PostComment::class);
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->image
            ? Storage::disk('public')->url($this->image)
            : null;
    }
}
