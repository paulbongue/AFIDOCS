<?php

namespace App\Providers;

use App\Models\Ressource;
use App\Policies\RessourcePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Enregistrement de la Policy filiere (controle serveur des publications).
        Gate::policy(Ressource::class, RessourcePolicy::class);

        // En production : forcer la generation d'URL en HTTPS (liens fichiers, etc.).
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }
    }
}
