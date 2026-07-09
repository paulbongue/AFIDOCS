<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Années académiques gérées par l'administration (ex. « 2025-2026 »).
 * Une seule année est « courante » à la fois ; elle sert de valeur par défaut
 * (notamment pour les évaluations des enseignants).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('annees_academiques', function (Blueprint $table) {
            $table->id();
            $table->string('libelle', 20)->unique();   // ex. 2025-2026
            $table->boolean('est_courante')->default(false);
            $table->timestamps();
        });

        // Année courante par défaut, déduite de la date (sept → août).
        $y = (int) now()->format('n') >= 9 ? (int) now()->format('Y') : (int) now()->format('Y') - 1;
        DB::table('annees_academiques')->insert([
            'libelle' => $y.'-'.($y + 1),
            'est_courante' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('annees_academiques');
    }
};
