<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ressources', function (Blueprint $table) {
            $table->id();
            $table->string('titre');
            $table->text('description')->nullable();

            // pdf | docx | pptx | xlsx | image | video | autre
            $table->enum('type_fichier', ['pdf', 'docx', 'pptx', 'xlsx', 'image', 'video', 'autre']);

            $table->string('chemin_fichier', 512);     // relatif a storage/app/public
            $table->unsignedBigInteger('taille_fichier'); // octets

            // NB : AUCUNE colonne `statut` -> publication directe (choix de conception).

            $table->foreignId('matiere_id')->constrained('matieres')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ressources');
    }
};
