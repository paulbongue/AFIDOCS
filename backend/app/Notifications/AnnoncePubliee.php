<?php

namespace App\Notifications;

use App\Models\Post;
use Illuminate\Notifications\Notification;

/**
 * Notification envoyée lorsqu'une annonce est publiée dans l'espace commun.
 * Destinataires : tout le monde si aucune filière n'est ciblée, sinon les
 * étudiants des filières (et niveau) ciblés. Canal : cloche in-app (database) ;
 * le push Expo est géré dans le contrôleur.
 */
class AnnoncePubliee extends Notification
{
    public function __construct(
        public Post $post,
        public string $message,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'annonce',
            'post_id' => $this->post->id,
            'link' => 'annonces',
            'message' => $this->message,
        ];
    }
}
