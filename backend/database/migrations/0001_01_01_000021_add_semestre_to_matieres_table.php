<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Semestre (global) d'une matière : L1=S1/S2, L2=S3/S4, L3=S5/S6, M1=S7/S8, M2=S9/S10.
 * Les ressources héritent du semestre de leur matière. Par défaut, chaque matière
 * existante est placée au 1er semestre de son niveau (2*ordre-1) ; l'admin ajuste.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('matieres', function (Blueprint $table) {
            $table->unsignedTinyInteger('semestre')->nullable()->after('niveau_id');
        });

        // Valeur par défaut = 1er semestre du niveau (2*ordre - 1), si l'ordre est connu.
        DB::table('matieres')
            ->join('niveaux', 'matieres.niveau_id', '=', 'niveaux.id')
            ->where('niveaux.ordre', '>', 0)
            ->update(['matieres.semestre' => DB::raw('(2 * niveaux.ordre - 1)')]);
    }

    public function down(): void
    {
        Schema::table('matieres', function (Blueprint $table) {
            $table->dropColumn('semestre');
        });
    }
};
