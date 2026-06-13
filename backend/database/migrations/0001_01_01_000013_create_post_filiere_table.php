<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pivot : filières ciblées par une publication (une publication peut viser
     * une ou plusieurs filières, choisies par code couleur). Vide = pour tous.
     */
    public function up(): void
    {
        Schema::create('post_filiere', function (Blueprint $table) {
            $table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
            $table->foreignId('filiere_id')->constrained('filieres')->cascadeOnDelete();
            $table->primary(['post_id', 'filiere_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_filiere');
    }
};
