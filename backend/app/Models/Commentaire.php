<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Interaction sociale autour d'une ressource (principe socioconstructiviste).
 * Aucune contrainte de filiere : tout utilisateur authentifie peut commenter
 * toute ressource (condition technique de la collaboration inter-filieres, H4).
 */
class Commentaire extends Model
{
    use HasFactory;

    protected $fillable = [
        'contenu',
        'ressource_id',
        'user_id',
    ];

    public function ressource(): BelongsTo
    {
        return $this->belongsTo(Ressource::class);
    }

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
