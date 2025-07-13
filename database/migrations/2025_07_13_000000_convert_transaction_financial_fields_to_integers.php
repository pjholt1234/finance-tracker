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
        Schema::table('transactions', function (Blueprint $table) {
            // Drop the existing text columns
            $table->dropColumn(['balance', 'paid_in', 'paid_out']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            // Add new integer columns (stored as pennies)
            $table->integer('balance')->nullable(); // Balance in pennies
            $table->integer('paid_in')->nullable(); // Paid in amount in pennies
            $table->integer('paid_out')->nullable(); // Paid out amount in pennies
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Drop the integer columns
            $table->dropColumn(['balance', 'paid_in', 'paid_out']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            // Restore the original text columns
            $table->text('balance'); // Encrypted balance string
            $table->text('paid_in')->nullable(); // Encrypted paid in amount
            $table->text('paid_out')->nullable(); // Encrypted paid out amount
        });
    }
};
