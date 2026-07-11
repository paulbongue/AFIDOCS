<?php

namespace App\Notifications;

use App\Models\Ressource;
use Illuminate\Notifications\Notification;

/**
 * Notification envoyée aux étudiants d'une classe lorsqu'une nouvelle ressource
 * y est publiée. Canal : base de données (cloche in-app). Le push Expo et
 * l'e-mail (vers l'adresse réelle, en BCC) sont gérés dans le contrôleur.
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
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'ressource_id' => $this->ressource->id,
            'titre' => $this->ressource->titre,
            'filiere_code' => $this->filiereCode,
            'filiere_nom' => $this->filiereNom,
            'matiere' => $this->matiereNom,
            'message' => "Nouvelle ressource en {$this->filiereNom} — « {$this->ressource->titre} »",
        ];
    }
}
