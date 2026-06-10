<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Envoi de notifications push via l'API Expo Push (https://exp.host).
 * Best-effort : n'interrompt jamais le flux métier en cas d'échec.
 */
class ExpoPushService
{
    public static function send(array $tokens, string $title, string $body, array $data = []): void
    {
        // Ne garder que des jetons Expo valides.
        $tokens = array_values(array_filter($tokens, fn ($t) =>
            is_string($t) && str_starts_with($t, 'ExponentPushToken')
        ));

        if (empty($tokens)) {
            return;
        }

        $messages = array_map(fn ($t) => [
            'to' => $t,
            'title' => $title,
            'body' => $body,
            'data' => $data,
            'sound' => 'default',
        ], $tokens);

        try {
            Http::timeout(8)
                ->withHeaders(['Accept' => 'application/json', 'Content-Type' => 'application/json'])
                ->post('https://exp.host/--/api/v2/push/send', $messages);
        } catch (\Throwable $e) {
            Log::warning('Echec envoi push Expo : '.$e->getMessage());
        }
    }
}
