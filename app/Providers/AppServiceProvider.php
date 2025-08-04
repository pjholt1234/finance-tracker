<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Force HTTPS URL generation when FORCE_SCHEME is set
        if (config('app.env') === 'production' || env('FORCE_SCHEME') === 'https') {
            URL::forceScheme('https');
        }
    }
}
