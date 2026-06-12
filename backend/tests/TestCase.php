<?php

namespace Tests;

use App\Models\Filiere;
use App\Models\Matiere;
use App\Models\Niveau;
use App\Models\User;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Hash;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        $app = require __DIR__.'/../bootstrap/app.php';
        $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

        return $app;
    }

    // --- Fabriques de donnees pour les tests -------------------------------

    protected function makeFiliere(string $code = 'SRT'): Filiere
    {
        return Filiere::create(['code' => $code, 'nom' => "Filiere {$code}", 'couleur' => '#14213D']);
    }

    protected function makeClasse(Filiere $filiere, string $nom = 'M1'): Niveau
    {
        return Niveau::create(['nom' => $nom, 'filiere_id' => $filiere->id]);
    }

    protected function makeMatiere(Niveau $niveau, string $nom = 'IA'): Matiere
    {
        return Matiere::create(['nom' => $nom, 'niveau_id' => $niveau->id]);
    }

    protected function makeUser(string $role, array $attrs = []): User
    {
        return User::create(array_merge([
            'name' => ucfirst($role).' Test',
            'email' => $role.'.'.uniqid().'@afi.sn',
            'password' => Hash::make('password'),
            'role' => $role,
        ], $attrs));
    }
}
