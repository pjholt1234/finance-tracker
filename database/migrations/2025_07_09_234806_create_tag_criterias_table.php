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
            
            // Criteria fields (all optional, at least one must be set)
            $table->string('description_match')->nullable(); // Exact description match
            $table->decimal('balance_match', 15, 2)->nullable(); // Exact balance match
            $table->date('date_match')->nullable(); // Exact date match
            
            // Criteria type and matching logic
            $table->enum('match_type', ['exact', 'contains', 'starts_with', 'ends_with'])->default('exact');
            
            $table->timestamps();
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
