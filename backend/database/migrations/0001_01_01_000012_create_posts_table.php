<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Publications de l'espace commun (interfilière). Seuls l'admin et les
     * délégués publient ; les étudiants commentent. Photo optionnelle (pas de
     * vidéo). Ciblage optionnel par filière(s) et/ou niveau (étiquette colorée).
     * Purgées au-delà de 30 jours.
     */
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('contenu')->nullable();
            $table->string('image')->nullable();
            // Ciblage optionnel sur un niveau précis (la filière passe par le pivot).
            $table->foreignId('target_niveau_id')->nullable()->constrained('niveaux')->nullOnDelete();
            $table->timestamps();

            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
