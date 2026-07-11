<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * E-mail de notification générique (nouvelle ressource, nouvelle annonce…),
 * envoyé en copie cachée (BCC) à un lot d'étudiants pour éviter d'exposer les
 * adresses et de multiplier les envois. Le « To » est l'adresse d'expédition.
 */
class NotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array<int, string>  $bccEmails
     */
    public function __construct(
        public string $titre,
        public string $corps,
        public array $bccEmails,
        public ?string $url = null,
    ) {}

    public function envelope(): Envelope
    {
        $expediteur = config('mail.from.address') ?: 'no-reply@afidocs.duckdns.org';

        return new Envelope(
            to: [$expediteur],
            bcc: $this->bccEmails,
            subject: 'AFI-DOCS — '.$this->titre,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.notification',
            with: [
                'titre' => $this->titre,
                'corps' => $this->corps,
                'url' => $this->url,
            ],
        );
    }
}
