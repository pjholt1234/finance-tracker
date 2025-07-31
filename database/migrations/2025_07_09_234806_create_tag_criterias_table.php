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
        Schema::create('tag_criterias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tag_id')->constrained()->onDelete('cascade');

            // Criteria type (description, amount, date)
            $table->enum('type', ['description', 'amount', 'date'])->default('description');

            // Match type for each criteria type
            $table->enum('match_type', [
                // Description matching
                'exact',
                'contains',
                'starts_with',
                'ends_with',
                // Amount matching
                'range',
                'greater_than',
                'less_than',
                // Date matching
                'day_of_month',
                'day_of_week',
            ])->default('exact');

            // Value fields for different criteria types
            $table->string('value')->nullable(); // For description, exact amount, exact date
            $table->decimal('value_to', 15, 2)->nullable(); // For amount ranges (max value)
            $table->integer('day_of_month')->nullable(); // For day_of_month (1-31)
            $table->integer('day_of_week')->nullable(); // For day_of_week (1-7, Monday=1)

            // Logic type for combining multiple criteria (AND/OR)
            $table->enum('logic_type', ['and', 'or'])->default('and');

            $table->timestamps();

            // Ensure each tag can only have one criteria of each type
            $table->unique(['tag_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tag_criterias');
    }
};
