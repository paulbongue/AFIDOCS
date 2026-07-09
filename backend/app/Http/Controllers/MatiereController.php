<?php

namespace App\Http\Controllers;

use App\Models\Matiere;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MatiereController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'niveau_id' => ['required', 'integer', 'exists:niveaux,id'],
            // Semestre global (1 à 10). Facultatif : sinon déduit du niveau.
            'semestre' => ['nullable', 'integer', 'between:1,10'],
            'enseignant' => ['nullable', 'string', 'max:255'],
        ]);

        return response()->json(['data' => Matiere::create($data)], 201);
    }

    public function update(Request $request, Matiere $matiere): JsonResponse
    {
        $data = $request->validate([
            'nom' => ['sometimes', 'string', 'max:255'],
            'niveau_id' => ['sometimes', 'integer', 'exists:niveaux,id'],
            'semestre' => ['nullable', 'integer', 'between:1,10'],
            'enseignant' => ['nullable', 'string', 'max:255'],
        ]);

        $matiere->update($data);

        return response()->json(['data' => $matiere]);
    }

    public function destroy(Matiere $matiere): JsonResponse
    {
        $matiere->delete();

        return response()->json(['message' => 'Matiere supprimee.']);
    }
}
