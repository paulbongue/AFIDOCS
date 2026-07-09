<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Rattache chaque ressource à une année académique (celle en cours au moment de
 * la publication). Permet de filtrer les ressources par année. La suppression
 * d'une année ne supprime pas les ressources (mise à NULL).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ressources', function (Blueprint $table) {
            $table->foreignId('annee_academique_id')->nullable()->after('user_id')
                ->constrained('annees_academiques')->nullOnDelete();
        });

        // Rattache les ressources existantes à l'année courante (si elle existe).
        $courante = DB::table('annees_academiques')->where('est_courante', true)->value('id')
            ?? DB::table('annees_academiques')->orderByDesc('libelle')->value('id');
        if ($courante) {
            DB::table('ressources')->whereNull('annee_academique_id')->update(['annee_academique_id' => $courante]);
        }
    }

    public function down(): void
    {
        Schema::table('ressources', function (Blueprint $table) {
            $table->dropConstrainedForeignId('annee_academique_id');
        });
    }
};
