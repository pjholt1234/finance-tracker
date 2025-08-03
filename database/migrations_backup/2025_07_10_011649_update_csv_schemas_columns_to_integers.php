<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('csv_schemas', function (Blueprint $table) {
            // Change column mappings from strings to integers (1-indexed column numbers)
            $table->integer('date_column')->change();
            $table->integer('balance_column')->change();
            $table->integer('amount_column')->nullable()->change();
            $table->integer('paid_in_column')->nullable()->change();
            $table->integer('paid_out_column')->nullable()->change();
            $table->integer('description_column')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('csv_schemas', function (Blueprint $table) {
            // Revert back to string columns
            $table->string('date_column')->change();
            $table->string('balance_column')->change();
            $table->string('amount_column')->nullable()->change();
            $table->string('paid_in_column')->nullable()->change();
            $table->string('paid_out_column')->nullable()->change();
            $table->string('description_column')->nullable()->change();
        });
    }
};
