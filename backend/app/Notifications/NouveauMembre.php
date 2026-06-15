<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

/**
 * Notification envoyée aux membres d'une classe lorsqu'un nouvel utilisateur y
 * est ajouté (transparence : chacun voit arriver les nouveaux comptes).
 * Canal : cloche in-app (database) ; le push Expo est géré dans le contrôleur.
 */
class NouveauMembre extends Notification
{
    public function __construct(
        public int $niveauId,
        public string $nom,
        public string $message,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'membre',
            'niveau_id' => $this->niveauId,
            'link' => 'classe',
            'message' => $this->message,
        ];
    }
}
