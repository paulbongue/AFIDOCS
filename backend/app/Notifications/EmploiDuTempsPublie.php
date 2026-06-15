<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

/**
 * Notification envoyée quand un emploi du temps épinglé est publié ou mis à jour
 * (commun par l'admin, ou de classe par le délégué). Canal : cloche in-app
 * (database) ; le push Expo est géré dans le contrôleur.
 */
class EmploiDuTempsPublie extends Notification
{
    public function __construct(
        public string $link,   // 'annonces' (commun) ou 'classe'
        public string $message,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'emploi',
            'link' => $this->link,
            'message' => $this->message,
        ];
    }
}
