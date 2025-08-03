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
        Schema::create('csv_schemas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name'); // User-friendly name for the schema
            $table->integer('transaction_data_start'); // Row where transaction data starts (1-indexed)

            // Column mappings - store column names or indices
            $table->string('date_column');
            $table->string('balance_column');
            $table->string('amount_column')->nullable(); // For single amount column
            $table->string('paid_in_column')->nullable(); // For separate paid in column
            $table->string('paid_out_column')->nullable(); // For separate paid out column
            $table->string('description_column')->nullable(); // Optional description column

            // Date format detection/storage
            $table->string('date_format')->nullable(); // e.g., 'MM/DD/YYYY', 'YYYY-MM-DD'

            $table->timestamps();

            // Ensure user can't have duplicate schema names
            $table->unique(['user_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('csv_schemas');
    }
};
