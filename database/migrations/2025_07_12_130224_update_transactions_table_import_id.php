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
            // Drop the existing import_id column and index
            $table->dropIndex(['user_id', 'import_id']);
            $table->dropColumn('import_id');

            // Add the new foreign key import_id
            $table->foreignId('import_id')->constrained()->onDelete('cascade');

            // Recreate the index
            $table->index(['user_id', 'import_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Drop the foreign key and index
            $table->dropForeign(['import_id']);
            $table->dropIndex(['user_id', 'import_id']);
            $table->dropColumn('import_id');

            // Restore the original string import_id
            $table->string('import_id');
            $table->index(['user_id', 'import_id']);
        });
    }
};
