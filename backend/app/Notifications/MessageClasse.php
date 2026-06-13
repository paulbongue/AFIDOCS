<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

/**
 * Notification envoyée aux membres d'une classe (étudiants + délégué) lorsqu'un
 * nouveau message est posté dans leur fil de discussion. Canal : cloche in-app
 * (database) ; le push Expo est géré dans le contrôleur.
 */
class MessageClasse extends Notification
{
    public function __construct(
        public int $niveauId,
        public string $message,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'message',
            'niveau_id' => $this->niveauId,
            'link' => 'classe',
            'message' => $this->message,
        ];
    }
}
