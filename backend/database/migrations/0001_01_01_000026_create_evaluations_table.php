<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Évaluation d'un enseignant (module) par un étudiant. Une seule évaluation par
 * étudiant, module, année académique et semestre. On conserve des instantanés
 * (nom de l'enseignant, du module) pour garder les résultats même si le
 * catalogue change ; les FK sont mises à NULL en cas de suppression.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('matiere_id')->nullable()->constrained('matieres')->nullOnDelete();
            $table->foreignId('filiere_id')->nullable()->constrained('filieres')->nullOnDelete();
            $table->foreignId('niveau_id')->nullable()->constrained('niveaux')->nullOnDelete();
            $table->foreignId('annee_academique_id')->nullable()->constrained('annees_academiques')->nullOnDelete();
            $table->unsignedTinyInteger('semestre')->nullable();
            $table->string('enseignant')->nullable();     // instantané
            $table->string('module_nom')->nullable();      // instantané
            $table->decimal('note', 4, 2);                 // moyenne /20
            $table->json('reponses');                      // notes des 15 questions
            $table->timestamps();

            // Une seule évaluation par étudiant / module / année / semestre.
            $table->unique(['user_id', 'matiere_id', 'annee_academique_id', 'semestre'], 'eval_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluations');
    }
};
