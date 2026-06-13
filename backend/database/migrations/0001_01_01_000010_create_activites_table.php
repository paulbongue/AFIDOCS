<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Journal d'activité : trace les actions des étudiants/délégués sur la
     * plateforme (téléchargements, consultations/aperçus, commentaires) en
     * distinguant l'origine web et mobile. Alimente le tableau de bord admin
     * (fréquence par jour) et le rapport d'activité téléchargeable.
     */
    public function up(): void
    {
        Schema::create('activites', function (Blueprint $table) {
            $table->id();

            // download = téléchargement, view = consultation/aperçu, comment = commentaire
            $table->string('type', 16);
            // web | mobile : origine de l'action
            $table->string('plateforme', 16)->default('web');

            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            // la ressource peut être supprimée sans effacer l'historique d'activité
            $table->foreignId('ressource_id')->nullable()->constrained('ressources')->nullOnDelete();

            $table->timestamps();

            $table->index(['type', 'created_at']);
            $table->index(['plateforme', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activites');
    }
};
