<?php

namespace App\Http\Controllers;

use App\Models\AnneeAcademique;
use App\Models\Evaluation;
use App\Models\Filiere;
use App\Models\Matiere;
use App\Models\Niveau;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class EvaluationController extends Controller
{
    /** Grille officielle AFI-L'UE : 15 indicateurs notés /20. */
    public const QUESTIONS = [
        'Présentation en début de séance des objectifs pédagogique et professionnel du module',
        'Capacité à choisir des exemples pratiques se référant à l\'entreprise',
        'Capacité à répondre aux questions relatives au cours',
        'Clarté et précision des explications',
        'Capacité à éviter la dictée',
        'Capacité à faire participer les étudiants',
        'Le cours a été animé avec des outils pédagogiques attractifs (vidéoprojecteur, images, vidéo)',
        'Capacité à suivre le contenu de formation dans le cahier de suivi des enseignements',
        'Les connaissances transmises ont été contrôlées (exposé, étude de cas, travaux de groupe…)',
        'Capacité à gérer la discipline dans la classe',
        'Capacité à mettre à votre disposition des supports de cours de qualité',
        'Capacité à animer le cours au lieu de rester assis',
        'Capacité à ne pas s\'absenter et à arriver à l\'heure',
        'Rapport avec les étudiants',
        'Correction dans sa tenue vestimentaire',
    ];

    /** Les 15 questions (formulaire étudiant). */
    public function questions(): JsonResponse
    {
        return response()->json(['data' => self::QUESTIONS]);
    }

    /**
     * Modules que l'étudiant connecté peut évaluer : les matières de SA classe
     * (niveau) qui ont un enseignant renseigné, avec l'indication de celles déjà
     * évaluées pour l'année courante et le semestre du module.
     */
    public function modules(Request $request): JsonResponse
    {
        $user = $request->user();
        $anneeId = AnneeAcademique::courante()?->id;

        if (! $user->niveau_id) {
            return response()->json(['data' => [], 'annee' => AnneeAcademique::courante()]);
        }

        $matieres = Matiere::where('niveau_id', $user->niveau_id)
            ->whereNotNull('enseignant')
            ->orderBy('semestre')->orderBy('nom')
            ->get(['id', 'nom', 'semestre', 'enseignant', 'niveau_id']);

        $dejaFaits = Evaluation::where('user_id', $user->id)
            ->where('annee_academique_id', $anneeId)
            ->pluck('semestre', 'matiere_id'); // matiere_id => semestre

        $data = $matieres->map(fn ($m) => [
            'matiere_id' => $m->id,
            'module' => $m->nom,
            'enseignant' => $m->enseignant,
            'semestre' => $m->semestre,
            'deja_evalue' => (int) ($dejaFaits[$m->id] ?? -1) === (int) $m->semestre,
        ]);

        return response()->json([
            'data' => $data,
            'annee' => AnneeAcademique::courante(),
        ]);
    }

    /** Soumission d'une évaluation par l'étudiant. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'matiere_id' => ['required', 'integer', 'exists:matieres,id'],
            'reponses' => ['required', 'array', 'size:15'],
            'reponses.*' => ['required', 'integer', 'between:0,20'],
        ]);

        $user = $request->user();
        $matiere = Matiere::with('niveau')->find($data['matiere_id']);

        // Sécurité : la matière doit être celle de la classe de l'étudiant et avoir un enseignant.
        if (! $matiere || (int) $matiere->niveau_id !== (int) $user->niveau_id || ! $matiere->enseignant) {
            throw ValidationException::withMessages([
                'matiere_id' => ['Vous ne pouvez pas évaluer ce module.'],
            ]);
        }

        $anneeId = AnneeAcademique::courante()?->id;

        $existe = Evaluation::where('user_id', $user->id)
            ->where('matiere_id', $matiere->id)
            ->where('annee_academique_id', $anneeId)
            ->where('semestre', $matiere->semestre)
            ->exists();
        if ($existe) {
            throw ValidationException::withMessages([
                'matiere_id' => ['Vous avez déjà évalué ce module cette année.'],
            ]);
        }

        $note = round(array_sum($data['reponses']) / count($data['reponses']), 2);

        $evaluation = Evaluation::create([
            'user_id' => $user->id,
            'matiere_id' => $matiere->id,
            'filiere_id' => $matiere->niveau?->filiere_id,
            'niveau_id' => $matiere->niveau_id,
            'annee_academique_id' => $anneeId,
            'semestre' => $matiere->semestre,
            'enseignant' => $matiere->enseignant,
            'module_nom' => $matiere->nom,
            'note' => $note,
            'reponses' => $data['reponses'],
        ]);

        return response()->json([
            'message' => 'Évaluation enregistrée. Merci !',
            'data' => ['id' => $evaluation->id, 'note' => $note],
        ], 201);
    }

    /**
     * Résultats agrégés (admin) : note générale par module/enseignant, rangée par
     * année académique, filière, niveau et semestre.
     */
    public function resultats(): JsonResponse
    {
        $rows = Evaluation::selectRaw(
            'annee_academique_id, filiere_id, niveau_id, semestre, matiere_id, '
            .'enseignant, module_nom, COUNT(*) as nb, AVG(note) as moyenne'
        )
            ->groupBy('annee_academique_id', 'filiere_id', 'niveau_id', 'semestre', 'matiere_id', 'enseignant', 'module_nom')
            ->get();

        $filieres = Filiere::pluck('code', 'id');
        $niveaux = Niveau::pluck('nom', 'id');
        $annees = AnneeAcademique::pluck('libelle', 'id');

        // Effectif attendu par classe (niveau) : étudiants + délégués rattachés.
        // Permet de mesurer la participation et de savoir si TOUS ont noté.
        $effectifs = User::whereIn('role', ['etudiant', 'delegue'])
            ->whereNotNull('niveau_id')
            ->selectRaw('niveau_id, COUNT(*) as n')
            ->groupBy('niveau_id')
            ->pluck('n', 'niveau_id');

        // Seuil de participation à partir duquel le rapport est jugé exploitable.
        $seuil = 0.80;

        $data = $rows->map(function ($r) use ($annees, $filieres, $niveaux, $effectifs, $seuil) {
            $attendus = (int) ($effectifs[$r->niveau_id] ?? 0);
            $nb = (int) $r->nb;
            $taux = $attendus > 0 ? (int) round($nb / $attendus * 100) : 0;

            return [
                'annee' => $annees[$r->annee_academique_id] ?? '—',
                'filiere' => $filieres[$r->filiere_id] ?? '—',
                'niveau' => $niveaux[$r->niveau_id] ?? '—',
                'semestre' => $r->semestre,
                'module' => $r->module_nom,
                'enseignant' => $r->enseignant,
                'nb' => $nb,
                'attendus' => $attendus,
                'taux' => $taux,                                   // % de participation
                'complet' => $attendus > 0 && ($nb / $attendus) >= $seuil, // ≥ 80 %
                'moyenne' => round((float) $r->moyenne, 2),
            ];
        })->sortBy([['annee', 'desc'], ['filiere', 'asc'], ['niveau', 'asc'], ['semestre', 'asc'], ['module', 'asc']])
          ->values();

        return response()->json(['data' => $data]);
    }
}
