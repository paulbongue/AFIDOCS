<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Petit client pour l'API Google Gemini (offre gratuite).
 * La clé se met dans .env : GEMINI_API_KEY=...
 */
class GeminiService
{
    /**
     * Génère une réponse.
     * @param string $system  Instruction système (rôle + contexte).
     * @param array  $contents Historique au format Gemini :
     *                         [['role'=>'user'|'model','parts'=>[['text'=>'...']]], ...]
     */
    public static function generate(string $system, array $contents): string
    {
        $key = config('services.gemini.key');
        if (!$key) {
            return "L'assistant n'est pas encore configuré (clé API manquante). "
                . "Ajoutez GEMINI_API_KEY dans le fichier .env du serveur.";
        }
        $model = config('services.gemini.model', 'gemini-2.0-flash');

        try {
            $res = Http::timeout(30)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}",
                [
                    'systemInstruction' => ['parts' => [['text' => $system]]],
                    'contents' => $contents,
                    'generationConfig' => [
                        'temperature' => 0.4,
                        'maxOutputTokens' => 900,
                    ],
                ]
            );

            if (!$res->ok()) {
                Log::warning('Gemini API error: ' . $res->status() . ' ' . $res->body());
                return "Désolé, l'assistant est momentanément indisponible. Réessayez dans un instant.";
            }

            $text = data_get($res->json(), 'candidates.0.content.parts.0.text');
            return $text ?: "Je n'ai pas pu générer de réponse. Reformulez votre question ?";
        } catch (\Throwable $e) {
            Log::warning('Gemini exception: ' . $e->getMessage());
            return "Désolé, l'assistant est momentanément indisponible. Réessayez dans un instant.";
        }
    }
}
