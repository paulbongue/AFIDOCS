<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Un délégué est rattaché à une CLASSE précise (= un niveau d'une filière),
 * et non à toute la filière. On ajoute donc niveau_id sur users.
 *   - NULL pour Admin et Étudiant
 *   - OBLIGATOIRE (au niveau métier) pour Délégué : c'est sa classe.
 * filiere_id reste renseigné (déduit du niveau) pour l'affichage du badge.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('niveau_id')->nullable()->after('filiere_id')
                ->constrained('niveaux')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('niveau_id');
        });
    }
};
