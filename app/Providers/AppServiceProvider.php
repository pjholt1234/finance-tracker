<?php

namespace App\Providers;

use App\Models\CsvSchema;
use App\Models\Transaction;
use App\Observers\TransactionObserver;
use App\Policies\CsvSchemaPolicy;
use Illuminate\Support\Facades\Gate;
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
        Transaction::observe(TransactionObserver::class);

        // Register policies
        Gate::policy(CsvSchema::class, CsvSchemaPolicy::class);
    }
}
