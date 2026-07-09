<?php

namespace App\Http\Controllers;

use App\Models\AnneeAcademique;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnneeAcademiqueController extends Controller
{
    /** Liste des années académiques (la courante en tête). */
    public function index(): JsonResponse
    {
        $annees = AnneeAcademique::orderByDesc('est_courante')
            ->orderByDesc('libelle')
            ->get();

        return response()->json([
            'data' => $annees,
            'courante' => AnneeAcademique::courante(),
        ]);
    }

    /** Ajout d'une année académique (admin). */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'libelle' => ['required', 'string', 'max:20', 'unique:annees_academiques,libelle'],
            'est_courante' => ['nullable', 'boolean'],
        ]);

        $annee = DB::transaction(function () use ($data) {
            $annee = AnneeAcademique::create([
                'libelle' => $data['libelle'],
                'est_courante' => (bool) ($data['est_courante'] ?? false),
            ]);
            if ($annee->est_courante) {
                AnneeAcademique::where('id', '!=', $annee->id)->update(['est_courante' => false]);
            }
            return $annee;
        });

        return response()->json(['data' => $annee], 201);
    }

    /** Définit l'année courante (admin). */
    public function setCurrent(AnneeAcademique $annee): JsonResponse
    {
        DB::transaction(function () use ($annee) {
            AnneeAcademique::query()->update(['est_courante' => false]);
            $annee->update(['est_courante' => true]);
        });

        return response()->json(['data' => $annee->fresh()]);
    }

    /** Suppression d'une année académique (admin). */
    public function destroy(AnneeAcademique $annee): JsonResponse
    {
        $annee->delete();

        return response()->json(['message' => 'Année académique supprimée.']);
    }
}
