<?php

namespace App\Notifications;

use App\Models\Ressource;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification envoyée à l'auteur d'une ressource (le délégué) et aux
 * administrateurs lorsqu'un nouveau commentaire est déposé.
 * Canaux : base de données (cloche in-app) + email. Push géré dans le contrôleur.
 */
class CommentairePublie extends Notification
{
    public function __construct(
        public Ressource $ressource,
        public string $auteurCommentaire,
        public string $extrait,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'ressource_id' => $this->ressource->id,
            'titre' => $this->ressource->titre,
            'type' => 'commentaire',
            'message' => "Nouveau commentaire de {$this->auteurCommentaire} sur « {$this->ressource->titre} »",
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/')
            . '/etudiant/ressources/' . $this->ressource->id;

        return (new MailMessage)
            ->subject('AFI-DOCS — Nouveau commentaire')
            ->greeting("Bonjour {$notifiable->name},")
            ->line("{$this->auteurCommentaire} a commenté la ressource « {$this->ressource->titre} » :")
            ->line("« {$this->extrait} »")
            ->action('Voir la ressource', $url)
            ->line('AFI-DOCS.');
    }
}
