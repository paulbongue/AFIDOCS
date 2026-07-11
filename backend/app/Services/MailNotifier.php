<?php

namespace App\Services;

use App\Mail\NotificationMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Envoi d'une notification par e-mail à un ensemble d'utilisateurs, en plus des
 * notifications in-app et push. On écrit vers l'adresse de sécurité RÉELLE
 * (contact_email) — jamais vers l'identifiant de connexion « nom@afi.sn » fictif.
 *
 * Les destinataires sont regroupés en BCC par lots pour n'envoyer qu'un message
 * par lot (rapide, protège les adresses). Toute erreur SMTP est journalisée sans
 * interrompre l'action en cours (publication d'une ressource, d'une annonce…).
 */
class MailNotifier
{
    /** Taille d'un lot de destinataires (limite BCC raisonnable). */
    private const CHUNK = 50;

    /**
     * @param  iterable  $recipients  Collection/tableau d'utilisateurs (ou d'adresses).
     */
    public static function send(iterable $recipients, string $titre, string $corps, ?string $url = null): void
    {
        try {
            $emails = collect($recipients)
                // Adresse confirmée en priorité ; sinon l'adresse réelle fournie à la
                // création (en attente de confirmation) pour toucher plus d'étudiants.
                ->map(fn ($u) => is_string($u) ? $u : ($u->contact_email ?? $u->contact_email_pending ?? null))
                ->filter(fn ($e) => $e && filter_var($e, FILTER_VALIDATE_EMAIL))
                ->map(fn ($e) => Str::lower(trim($e)))
                ->unique()
                ->values();

            if ($emails->isEmpty()) {
                return;
            }

            foreach ($emails->chunk(self::CHUNK) as $lot) {
                Mail::send(new NotificationMail($titre, $corps, $lot->all(), $url));
            }
        } catch (\Throwable $e) {
            Log::warning('Notification e-mail échouée : '.$e->getMessage());
        }
    }
}
