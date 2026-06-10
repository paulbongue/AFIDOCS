<?php

namespace App\Http\Controllers;

use App\Models\Filiere;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FiliereController extends Controller
{
    /**
     * Catalogue complet : filieres -> niveaux -> matieres.
     * Sert a alimenter les filtres de l'app (et le cache hors-ligne).
     */
    public function index(): JsonResponse
    {
        $filieres = Filiere::with(['niveaux.matieres'])
            ->orderBy('code')
            ->get();

        return response()->json(['data' => $filieres]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:10', 'unique:filieres,code'],
            'nom' => ['required', 'string', 'max:255'],
            'couleur' => ['required', 'string', 'max:9'],
        ]);

        $filiere = Filiere::create($data);

        return response()->json(['data' => $filiere], 201);
    }

    public function update(Request $request, Filiere $filiere): JsonResponse
    {
        $data = $request->validate([
            'code' => ['sometimes', 'string', 'max:10', 'unique:filieres,code,'.$filiere->id],
            'nom' => ['sometimes', 'string', 'max:255'],
            'couleur' => ['sometimes', 'string', 'max:9'],
        ]);

        $filiere->update($data);

        return response()->json(['data' => $filiere]);
    }

    public function destroy(Filiere $filiere): JsonResponse
    {
        $filiere->delete();

        return response()->json(['message' => 'Filiere supprimee.']);
    }
}
