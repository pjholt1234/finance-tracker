<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\CsvSchemaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\TransactionImportController;

Route::get('/', function () {
    return redirect()->route('dashboard.index');
})->middleware(['auth', 'verified', 'two-factor'])->name('home');

Route::middleware(['api'])
    ->prefix('api')
    ->group(function () {
        Route::get('/tags/suggestions', [TagController::class, 'suggestions']);
    });

Route::middleware(['auth', 'verified', 'two-factor'])->group(function () {
    // Account routes
    Route::resource('accounts', AccountController::class);
    Route::post('accounts/{account}/recalculate-balance', [AccountController::class, 'recalculateBalance'])->name('accounts.recalculate-balance');

    Route::resource('csv-schemas', CsvSchemaController::class);
    Route::post('csv-schemas/preview', [CsvSchemaController::class, 'preview'])->name('csv-schemas.preview');
    Route::post('csv-schemas/{csv_schema}/clone', [CsvSchemaController::class, 'clone'])->name('csv-schemas.clone');

    // Tag routes
    Route::resource('tags', TagController::class);
    Route::post('tags/{tag}/archive', [TagController::class, 'archive'])->name('tags.archive');
    Route::post('tags/{tag}/unarchive', [TagController::class, 'unarchive'])->name('tags.unarchive');
    Route::get('tags/{tag}/api', [TagController::class, 'apiShow'])->name('tags.api-show');

    // Dashboard routes
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard.index');
    Route::get('dashboard/api', [DashboardController::class, 'dashboard'])->name('dashboard.api');

    // Transaction Import routes
    Route::get('imports', [TransactionImportController::class, 'index'])->name('transaction-imports.index');
    Route::get('imports/create', [TransactionImportController::class, 'create'])->name('transaction-imports.create');
    Route::post('imports', [TransactionImportController::class, 'store'])->name('transaction-imports.store');
    Route::post('imports/finalize', [TransactionImportController::class, 'finalize'])->name('transaction-imports.finalize');
    Route::get('imports/{import}', [TransactionImportController::class, 'show'])->name('transaction-imports.show');
    Route::delete('imports/{import}', [TransactionImportController::class, 'destroy'])->name('transaction-imports.destroy');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
