<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\CsvSchemaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\TransactionImportController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified', 'two-factor'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('csv-schemas', CsvSchemaController::class);
    Route::post('csv-schemas/preview', [CsvSchemaController::class, 'preview'])->name('csv-schemas.preview');
    Route::post('csv-schemas/{csv_schema}/clone', [CsvSchemaController::class, 'clone'])->name('csv-schemas.clone');

    // Tag routes
    Route::post('tags', [TagController::class, 'store'])->name('tags.store');

    // Transaction Import routes
    Route::get('transaction-imports', [TransactionImportController::class, 'index'])->name('transaction-imports.index');
    Route::get('transaction-imports/create', [TransactionImportController::class, 'create'])->name('transaction-imports.create');
    Route::post('transaction-imports', [TransactionImportController::class, 'store'])->name('transaction-imports.store');
    Route::post('transaction-imports/finalize', [TransactionImportController::class, 'finalize'])->name('transaction-imports.finalize');
    Route::get('transaction-imports/{import}', [TransactionImportController::class, 'show'])->name('transaction-imports.show');
    Route::delete('transaction-imports/{import}', [TransactionImportController::class, 'destroy'])->name('transaction-imports.destroy');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
