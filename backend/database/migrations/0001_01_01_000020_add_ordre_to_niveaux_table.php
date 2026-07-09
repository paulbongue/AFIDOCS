<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Ordre hiérarchique des niveaux (L1<L2<L3<M1<M2) : indispensable pour la règle
 * d'accès « son niveau et en-dessous ». On stocke un entier `ordre` déduit du nom.
 */
return new class extends Migration
{
    private array $map = ['L1' => 1, 'L2' => 2, 'L3' => 3, 'M1' => 4, 'M2' => 5];

    public function up(): void
    {
        Schema::table('niveaux', function (Blueprint $table) {
            $table->unsignedTinyInteger('ordre')->default(0)->after('nom');
        });

        foreach ($this->map as $nom => $ordre) {
            DB::table('niveaux')->whereRaw('UPPER(nom) = ?', [$nom])->update(['ordre' => $ordre]);
        }
    }

    public function down(): void
    {
        Schema::table('niveaux', function (Blueprint $table) {
            $table->dropColumn('ordre');
        });
    }
};
