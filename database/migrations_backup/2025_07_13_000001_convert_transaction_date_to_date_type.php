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
            // Drop the existing text column
            $table->dropColumn('date');
        });

        Schema::table('transactions', function (Blueprint $table) {
            // Add new date column
            $table->date('date'); // Standard SQL date format (Y-m-d)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Drop the date column
            $table->dropColumn('date');
        });

        Schema::table('transactions', function (Blueprint $table) {
            // Restore the original text column
            $table->text('date'); // Encrypted date string
        });
    }
};
