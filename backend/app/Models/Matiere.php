<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Enseignement rattache a un niveau precis.
 * C'est au niveau de la Matiere que les ressources sont agregees.
 */
class Matiere extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'niveau_id',
    ];

    public function niveau(): BelongsTo
    {
        return $this->belongsTo(Niveau::class);
    }

    public function ressources(): HasMany
    {
        return $this->hasMany(Ressource::class);
    }
}
