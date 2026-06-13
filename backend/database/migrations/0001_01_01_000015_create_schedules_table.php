<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Emplois du temps ÉPINGLÉS (non éphémères), affichés en haut de chaque
     * espace de discussion :
     *   - scope = 'class'  : emploi du temps du semestre d'une classe (niveau),
     *                        géré par le délégué de la classe.
     *   - scope = 'common' : emploi du temps général de l'espace commun,
     *                        géré par l'admin (une seule entrée, niveau_id NULL).
     */
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->string('scope', 16); // class | common
            $table->foreignId('niveau_id')->nullable()->constrained('niveaux')->cascadeOnDelete();
            $table->string('titre')->default('Emploi du temps');
            $table->text('description')->nullable();
            $table->string('chemin_fichier')->nullable();
            $table->string('type_fichier', 16)->nullable();
            $table->unsignedBigInteger('taille_fichier')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['scope', 'niveau_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
