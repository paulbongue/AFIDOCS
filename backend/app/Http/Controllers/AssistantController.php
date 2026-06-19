<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Ressource;
use App\Models\User;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Assistant IA de la plateforme (Google Gemini).
 * - chat   : répond aux questions et guide l'utilisateur (réponses contextuelles).
 * - digest : résume les dernières annonces + nouveaux cours de sa filière.
 * L'assistant ne fait qu'INFORMER et GUIDER : il n'exécute aucune action.
 */
class AssistantController extends Controller
{
    public function chat(Request $request): JsonResponse
    {
        $data = $request->validate([
            'messages' => ['required', 'array', 'min:1', 'max:30'],
            'messages.*.role' => ['required', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'max:2000'],
        ]);

        $user = $request->user();
        $system = $this->systemPrompt($user);

        // Historique -> format Gemini (assistant => model). On garde les 12 derniers.
        $contents = [];
        foreach (array_slice($data['messages'], -12) as $m) {
            $contents[] = [
                'role' => $m['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $m['content']]],
            ];
        }

        $reply = GeminiService::generate($system, $contents);

        return response()->json(['reply' => $reply]);
    }

    public function digest(Request $request): JsonResponse
    {
        $user = $request->user();
        $news = $this->newsText($user);

        $system = "Tu es l'assistant de AFI-DOCS. Résume pour l'utilisateur, en français, "
            . "les nouveautés ci-dessous : 3 à 5 puces courtes, concrètes et utiles "
            . "(annonces importantes en premier, puis nouveaux cours de sa filière). "
            . "Commence directement par les puces, sans préambule. "
            . "S'il n'y a vraiment rien de neuf, réponds simplement « Rien de nouveau pour le moment. ».";

        $contents = [['role' => 'user', 'parts' => [['text' => $news]]]];
        $summary = GeminiService::generate($system, $contents);

        return response()->json(['summary' => $summary]);
    }

    /** Instruction système : rôle + cadre + contexte utilisateur + nouveautés. */
    private function systemPrompt(User $user): string
    {
        return <<<TXT
Tu es l'assistant de **AFI-DOCS**, la plateforme de ressources pédagogiques de l'Université AFI-L'UE.
Rôle de la plateforme : les étudiants y consultent et téléchargent leurs cours (PDF, Word, PPT, Excel, images) classés par filière → niveau → matière, consultent les annonces et l'emploi du temps, et échangent dans l'espace de leur classe. Les délégués publient des ressources pour leur classe ; l'administration gère la plateforme.

Consignes :
- Réponds en français, de façon concise, claire et bienveillante.
- Reste STRICTEMENT dans le cadre de la plateforme et des études de l'utilisateur. Si la question sort de ce cadre, recentre poliment.
- Pour aider à une tâche, explique les étapes et indique la page concernée (ex. « Ressources », « Annonces », « Mon profil », « Hors-ligne »). Tu ne peux pas agir à la place de l'utilisateur : tu guides.
- Appuie-toi sur le CONTEXTE ci-dessous (profil, annonces, cours récents) quand c'est pertinent. Si l'information n'y est pas, invite à utiliser la recherche dans « Ressources ».

{$this->userContext($user)}

{$this->newsText($user)}
TXT;
    }

    private function userContext(User $user): string
    {
        $u = $user->loadMissing('filiere', 'niveau');
        $lines = ["CONTEXTE UTILISATEUR :", "- Nom : {$u->name}", "- Rôle : {$u->role}"];
        if ($u->filiere) {
            $lines[] = "- Filière : {$u->filiere->code} — {$u->filiere->nom}";
        }
        if ($u->niveau) {
            $lines[] = "- Niveau / classe : {$u->niveau->nom}";
        }
        return implode("\n", $lines);
    }

    /** Bloc texte des dernières annonces + cours récents pertinents pour l'utilisateur. */
    private function newsText(User $user): string
    {
        $fid = $user->filiere_id;
        $isAdmin = $user->role === 'admin';

        // Annonces visibles : globales (sans filière ciblée) ou ciblant la filière de l'utilisateur.
        $posts = Post::with(['auteur:id,name', 'filieres:id,code'])
            ->latest()->limit(15)->get()
            ->filter(function ($p) use ($fid, $isAdmin) {
                if ($isAdmin) return true;
                if ($p->filieres->isEmpty()) return true;
                return $fid && $p->filieres->contains('id', $fid);
            })
            ->take(6);

        // Cours récents : ceux de la filière de l'utilisateur (ou tous, pour l'admin/sans filière).
        $res = Ressource::with(['matiere.niveau.filiere', 'auteur:id,name'])
            ->when($fid && !$isAdmin, fn ($q) => $q->whereHas('matiere.niveau', fn ($qq) => $qq->where('filiere_id', $fid)))
            ->latest()->limit(6)->get();

        $lines = ['ANNONCES RÉCENTES :'];
        if ($posts->isEmpty()) {
            $lines[] = '- (aucune)';
        } else {
            foreach ($posts as $p) {
                $when = optional($p->created_at)->format('d/m');
                $who = $p->auteur->name ?? 'Administration';
                $txt = trim((string) $p->contenu) !== '' ? mb_strimwidth($p->contenu, 0, 160, '…') : '(photo / pièce jointe)';
                $cible = $p->filieres->isEmpty() ? 'tous' : $p->filieres->pluck('code')->implode(', ');
                $lines[] = "- [{$when}] {$who} ({$cible}) : {$txt}";
            }
        }

        $lines[] = '';
        $lines[] = 'NOUVEAUX COURS' . ($fid && !$isAdmin ? ' DE TA FILIÈRE' : '') . ' :';
        if ($res->isEmpty()) {
            $lines[] = '- (aucun)';
        } else {
            foreach ($res as $r) {
                $when = optional($r->created_at)->format('d/m');
                $fil = $r->matiere->niveau->filiere->code ?? '';
                $niv = $r->matiere->niveau->nom ?? '';
                $mat = $r->matiere->nom ?? '';
                $lines[] = "- [{$when}] « {$r->titre} » ({$fil} · {$niv} · {$mat})";
            }
        }

        return implode("\n", $lines);
    }
}
