<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Nom de l'enseignant qui dispense la matière (module). Renseigné par l'admin ou
 * le délégué. Sert à l'évaluation des enseignants par les étudiants.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('matieres', function (Blueprint $table) {
            $table->string('enseignant')->nullable()->after('semestre');
        });
    }

    public function down(): void
    {
        Schema::table('matieres', function (Blueprint $table) {
            $table->dropColumn('enseignant');
        });
    }
};
