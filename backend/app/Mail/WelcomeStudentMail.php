<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * E-mail de bienvenue envoyé automatiquement à la création d'un compte :
 * identifiant de connexion, mot de passe initial et invitation à confirmer
 * l'adresse e-mail de sécurité une fois connecté.
 */
class WelcomeStudentMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $userName,
        public string $identifiant,
        public string $motDePasse,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Bienvenue sur AFI-DOCS — vos accès');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.welcome_student',
            with: [
                'userName' => $this->userName,
                'identifiant' => $this->identifiant,
                'motDePasse' => $this->motDePasse,
            ],
        );
    }
}
