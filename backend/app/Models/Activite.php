<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Trace d'une action utilisateur sur la plateforme (téléchargement,
 * consultation/aperçu, commentaire), avec l'origine (web | mobile).
 * Sert au suivi statistique du tableau de bord admin et au rapport d'activité.
 */
class Activite extends Model
{
    use HasFactory;

    public const TYPE_DOWNLOAD = 'download';
    public const TYPE_VIEW = 'view';
    public const TYPE_COMMENT = 'comment';

    public const TYPES = [self::TYPE_DOWNLOAD, self::TYPE_VIEW, self::TYPE_COMMENT];
    public const PLATEFORMES = ['web', 'mobile'];

    protected $table = 'activites';

    protected $fillable = [
        'type',
        'plateforme',
        'user_id',
        'ressource_id',
    ];

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function ressource(): BelongsTo
    {
        return $this->belongsTo(Ressource::class);
    }

    /**
     * Normalise l'origine déclarée par le client (en-tête X-Platform).
     */
    public static function normalisePlateforme(?string $value): string
    {
        $value = strtolower((string) $value);

        return $value === 'mobile' ? 'mobile' : 'web';
    }
}
