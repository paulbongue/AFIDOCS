<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('filieres', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();   // MAI, BAF, GSE, TL, MMC, QHSE, GRH, DWMD, GL, SRT, MJF, LEA
            $table->string('nom');
            $table->string('couleur', 9);            // badge hexadecimal (#RRGGBB)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('filieres');
    }
};
