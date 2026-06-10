<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Une des 8 formations de l'AFI : BAF, GSE, GRH, IR, MJF, MMC, MAI, GL.
 * Sommet de la hierarchie pedagogique filiere -> niveau -> matiere -> ressource.
 * `couleur` : code hexadecimal pour le badge visuel cote app.
 */
class Filiere extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'nom',
        'couleur',
    ];

    public function niveaux(): HasMany
    {
        return $this->hasMany(Niveau::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
