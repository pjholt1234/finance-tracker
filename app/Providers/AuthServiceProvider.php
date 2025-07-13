<?php

namespace App\Providers;

use App\Models\Account;
use App\Models\CsvSchema;
use App\Models\Import;
use App\Models\Tag;
use App\Models\TagCriteria;
use App\Models\Transaction;
use App\Policies\AccountPolicy;
use App\Policies\CsvSchemaPolicy;
use App\Policies\ImportPolicy;
use App\Policies\TagCriteriaPolicy;
use App\Policies\TagPolicy;
use App\Policies\TransactionPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Account::class => AccountPolicy::class,
        CsvSchema::class => CsvSchemaPolicy::class,
        Import::class => ImportPolicy::class,
        Tag::class => TagPolicy::class,
        TagCriteria::class => TagCriteriaPolicy::class,
        Transaction::class => TransactionPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
}
