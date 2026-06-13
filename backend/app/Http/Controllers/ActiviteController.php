<?php

namespace App\Http\Controllers;

use App\Models\Activite;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ActiviteController extends Controller
{
    /**
     * Enregistre une action utilisateur (consultation/aperçu ou téléchargement).
     * Les commentaires sont tracés directement par le CommentaireController.
     * L'origine (web | mobile) provient de l'en-tête X-Platform envoyé par le client.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in([Activite::TYPE_DOWNLOAD, Activite::TYPE_VIEW])],
            'ressource_id' => ['nullable', 'integer', 'exists:ressources,id'],
        ]);

        $activite = Activite::create([
            'type' => $data['type'],
            'plateforme' => Activite::normalisePlateforme($request->header('X-Platform')),
            'user_id' => $request->user()->id,
            'ressource_id' => $data['ressource_id'] ?? null,
        ]);

        return response()->json(['data' => $activite], 201);
    }

    /**
     * Fréquence des actions par jour (tableau de bord admin).
     * Paramètre ?days=N (défaut 14, borné à 90).
     */
    public function daily(Request $request): JsonResponse
    {
        $days = (int) $request->query('days', 14);
        $days = max(1, min($days, 90));

        $start = Carbon::today()->subDays($days - 1);

        $rows = Activite::query()
            ->where('created_at', '>=', $start)
            ->selectRaw('DATE(created_at) as jour, type, plateforme, COUNT(*) as n')
            ->groupBy('jour', 'type', 'plateforme')
            ->get();

        // Squelette : un point par jour, à zéro, pour une courbe continue.
        $days_map = [];
        for ($d = 0; $d < $days; $d++) {
            $key = $start->copy()->addDays($d)->toDateString();
            $days_map[$key] = ['date' => $key, 'download' => 0, 'view' => 0, 'comment' => 0];
        }

        $totaux = ['download' => 0, 'view' => 0, 'comment' => 0];
        $plateforme = [
            'web' => ['download' => 0, 'view' => 0, 'comment' => 0],
            'mobile' => ['download' => 0, 'view' => 0, 'comment' => 0],
        ];

        foreach ($rows as $r) {
            $n = (int) $r->n;
            if (isset($days_map[$r->jour][$r->type])) {
                $days_map[$r->jour][$r->type] += $n;
            }
            if (isset($totaux[$r->type])) {
                $totaux[$r->type] += $n;
            }
            $plat = $r->plateforme === 'mobile' ? 'mobile' : 'web';
            if (isset($plateforme[$plat][$r->type])) {
                $plateforme[$plat][$r->type] += $n;
            }
        }

        return response()->json([
            'days' => array_values($days_map),
            'totaux' => $totaux,
            'par_plateforme' => $plateforme,
        ]);
    }

    /**
     * Rapport d'activité téléchargeable (CSV), structuré pour séparer
     * clairement l'activité web de l'activité mobile, sur une période choisie.
     * Paramètres ?from=YYYY-MM-DD&to=YYYY-MM-DD (défaut : 30 derniers jours).
     */
    public function report(Request $request): StreamedResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $to = isset($data['to']) ? Carbon::parse($data['to'])->endOfDay() : Carbon::today()->endOfDay();
        $from = isset($data['from']) ? Carbon::parse($data['from'])->startOfDay() : $to->copy()->subDays(29)->startOfDay();
        if ($from->gt($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        $rows = Activite::query()
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('DATE(created_at) as jour, type, plateforme, COUNT(*) as n')
            ->groupBy('jour', 'type', 'plateforme')
            ->orderBy('jour')
            ->get();

        // Agrégation : [jour][plateforme][type] = n
        $agg = [];
        $totaux = [
            'web' => ['download' => 0, 'view' => 0, 'comment' => 0],
            'mobile' => ['download' => 0, 'view' => 0, 'comment' => 0],
        ];
        foreach ($rows as $r) {
            $plat = $r->plateforme === 'mobile' ? 'mobile' : 'web';
            $type = in_array($r->type, ['download', 'view', 'comment'], true) ? $r->type : 'view';
            $agg[$r->jour][$plat][$type] = ($agg[$r->jour][$plat][$type] ?? 0) + (int) $r->n;
            $totaux[$plat][$type] += (int) $r->n;
        }
        ksort($agg);

        $filename = 'rapport-activite-afidocs_'.$from->toDateString().'_'.$to->toDateString().'.csv';

        $labels = ['Téléchargements', 'Consultations', 'Commentaires'];

        return response()->streamDownload(function () use ($agg, $totaux, $from, $to) {
            $out = fopen('php://output', 'w');
            // BOM UTF-8 : accents corrects à l'ouverture dans Excel.
            fwrite($out, "\xEF\xBB\xBF");

            $sep = static function ($out) { fputcsv($out, []); };

            fputcsv($out, ['RAPPORT D\'ACTIVITÉ — AFI-DOCS']);
            fputcsv($out, ['Période', $from->toDateString().' au '.$to->toDateString()]);
            fputcsv($out, ['Généré le', now()->toDateTimeString()]);
            $sep($out);

            // --- Synthèse séparant web et mobile -----------------------------
            fputcsv($out, ['SYNTHÈSE PAR PLATEFORME']);
            fputcsv($out, ['Plateforme', 'Téléchargements', 'Consultations', 'Commentaires', 'Total']);
            foreach (['web' => 'EN LIGNE (Web)', 'mobile' => 'MOBILE'] as $plat => $libelle) {
                $t = $totaux[$plat];
                $total = $t['download'] + $t['view'] + $t['comment'];
                fputcsv($out, [$libelle, $t['download'], $t['view'], $t['comment'], $total]);
            }
            $gt = [
                'download' => $totaux['web']['download'] + $totaux['mobile']['download'],
                'view' => $totaux['web']['view'] + $totaux['mobile']['view'],
                'comment' => $totaux['web']['comment'] + $totaux['mobile']['comment'],
            ];
            fputcsv($out, ['TOTAL GÉNÉRAL', $gt['download'], $gt['view'], $gt['comment'], $gt['download'] + $gt['view'] + $gt['comment']]);
            $sep($out);

            // --- Détail journalier : colonnes web puis mobile ----------------
            fputcsv($out, ['DÉTAIL PAR JOUR']);
            fputcsv($out, [
                'Date',
                'Web — Téléch.', 'Web — Consult.', 'Web — Comment.',
                'Mobile — Téléch.', 'Mobile — Consult.', 'Mobile — Comment.',
                'Total du jour',
            ]);
            foreach ($agg as $jour => $plats) {
                $w = $plats['web'] ?? [];
                $m = $plats['mobile'] ?? [];
                $wv = [(int) ($w['download'] ?? 0), (int) ($w['view'] ?? 0), (int) ($w['comment'] ?? 0)];
                $mv = [(int) ($m['download'] ?? 0), (int) ($m['view'] ?? 0), (int) ($m['comment'] ?? 0)];
                $totalJour = array_sum($wv) + array_sum($mv);
                fputcsv($out, array_merge([$jour], $wv, $mv, [$totalJour]));
            }

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
