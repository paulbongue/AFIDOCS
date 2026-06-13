<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Messages du fil de discussion d'une CLASSE (= un niveau d'une filière).
     * Éphémères : purgés au-delà de 7 jours pour libérer la base.
     * Accessible uniquement aux membres de la classe ; le délégué modère.
     */
    public function up(): void
    {
        Schema::create('class_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('niveau_id')->constrained('niveaux')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('contenu');
            $table->timestamps();

            $table->index(['niveau_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_messages');
    }
};
