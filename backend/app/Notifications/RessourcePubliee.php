<?php

namespace App\Notifications;

use App\Models\Ressource;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification envoyée aux étudiants d'une filière lorsqu'une nouvelle
 * ressource y est publiée. Canaux : base de données (cloche in-app) + email.
 * Le push Expo est géré séparément dans le contrôleur (jeton d'appareil).
 */
class RessourcePubliee extends Notification
{
    public function __construct(
        public Ressource $ressource,
        public string $filiereCode,
        public string $filiereNom,
        public string $matiereNom,
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
            'filiere_code' => $this->filiereCode,
            'matiere' => $this->matiereNom,
            'message' => "Nouvelle ressource en {$this->filiereCode} — « {$this->ressource->titre} »",
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/')
            . '/etudiant/ressources/' . $this->ressource->id;

        return (new MailMessage)
            ->subject("AFI-DOCS — Nouvelle ressource en {$this->filiereCode}")
            ->greeting("Bonjour {$notifiable->name},")
            ->line("Une nouvelle ressource vient d'être publiée en {$this->filiereNom} ({$this->matiereNom}) :")
            ->line("« {$this->ressource->titre} »")
            ->action('Consulter la ressource', $url)
            ->line('Bonne lecture sur AFI-DOCS.');
    }
}
