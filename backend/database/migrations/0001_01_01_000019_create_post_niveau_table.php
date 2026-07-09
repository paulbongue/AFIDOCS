<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ciblage d'une annonce par plusieurs niveaux (au lieu d'un seul).
 * Table pivot post_niveau : une annonce peut viser plusieurs niveaux précis.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('post_niveau', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
            $table->foreignId('niveau_id')->constrained('niveaux')->cascadeOnDelete();
            $table->unique(['post_id', 'niveau_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_niveau');
    }
};
