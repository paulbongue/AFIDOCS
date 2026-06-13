<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Message du fil de discussion d'une classe (niveau d'une filière).
 * Éphémère : voir DiscussionController::purge (suppression au-delà de 7 jours).
 */
class ClassMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'niveau_id',
        'user_id',
        'contenu',
    ];

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function niveau(): BelongsTo
    {
        return $this->belongsTo(Niveau::class);
    }
}
