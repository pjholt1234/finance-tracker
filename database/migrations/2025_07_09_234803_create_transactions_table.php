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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Encrypted transaction data (encrypted in frontend)
            $table->text('date'); // Encrypted date string
            $table->text('balance'); // Encrypted balance string
            $table->text('paid_in')->nullable(); // Encrypted paid in amount
            $table->text('paid_out')->nullable(); // Encrypted paid out amount
            $table->text('description')->nullable(); // Encrypted description

            // Import tracking
            $table->string('import_id'); // UUID or identifier for the import batch

            // Duplicate prevention
            $table->string('unique_hash')->unique(); // Hash of user_id + date + balance + paid_in + paid_out

            $table->timestamps();

            // Index for performance
            $table->index(['user_id', 'import_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
