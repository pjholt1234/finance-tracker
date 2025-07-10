<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\CsvSchemaController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified', 'require.2fa'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // CSV Schema routes
    Route::resource('csv-schemas', CsvSchemaController::class);
    Route::post('csv-schemas/preview', [CsvSchemaController::class, 'preview'])->name('csv-schemas.preview');
    Route::post('csv-schemas/{csv_schema}/clone', [CsvSchemaController::class, 'clone'])->name('csv-schemas.clone');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
