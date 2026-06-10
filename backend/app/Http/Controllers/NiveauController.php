<?php

namespace App\Http\Controllers;

use App\Models\Niveau;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NiveauController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:50'],
            'filiere_id' => ['required', 'integer', 'exists:filieres,id'],
        ]);

        return response()->json(['data' => Niveau::create($data)], 201);
    }

    public function update(Request $request, Niveau $niveau): JsonResponse
    {
        $data = $request->validate([
            'nom' => ['sometimes', 'string', 'max:50'],
            'filiere_id' => ['sometimes', 'integer', 'exists:filieres,id'],
        ]);

        $niveau->update($data);

        return response()->json(['data' => $niveau]);
    }

    public function destroy(Niveau $niveau): JsonResponse
    {
        $niveau->delete();

        return response()->json(['message' => 'Niveau supprime.']);
    }
}
