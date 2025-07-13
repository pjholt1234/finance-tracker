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
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->integer('number');
            $table->string('sort_code');
            $table->string('description')->nullable();
            $table->integer('balance_at_start')->default(0);
            $table->date('balance_start_date')->nullable();
            $table->integer('balance')->default(0);
            $table->timestamps();

            // Ensure user can't have duplicate account numbers
            $table->unique(['user_id', 'number']);

            // Index for performance
            $table->index(['user_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
