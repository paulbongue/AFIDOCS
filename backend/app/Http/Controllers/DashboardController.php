<?php

namespace App\Http\Controllers;

use App\Models\Commentaire;
use App\Models\Filiere;
use App\Models\Ressource;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Statistiques pour le tableau de bord Administrateur.
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'totaux' => [
                'ressources' => Ressource::count(),
                'utilisateurs' => User::count(),
                'commentaires' => Commentaire::count(),
                'filieres' => Filiere::count(),
            ],
            'ressources_par_filiere' => Filiere::withCount(['niveaux'])
                ->get(['id', 'code', 'nom', 'couleur'])
                ->map(function ($filiere) {
                    $count = Ressource::whereHas('matiere.niveau', fn ($q) => $q->where('filiere_id', $filiere->id))->count();

                    return [
                        'code' => $filiere->code,
                        'nom' => $filiere->nom,
                        'couleur' => $filiere->couleur,
                        'ressources' => $count,
                    ];
                }),
        ]);
    }
}
