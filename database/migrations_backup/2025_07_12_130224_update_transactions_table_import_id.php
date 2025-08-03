<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Only run this migration if import_id column exists and is not already a foreign key
        if (!Schema::hasColumn('transactions', 'import_id')) {
            return;
        }

        // Check if import_id is already a foreign key by checking its type
        $columnType = DB::select("SHOW COLUMNS FROM transactions WHERE Field = 'import_id'")[0]->Type ?? '';

        // If it's already bigint unsigned, it's likely already a foreign key, skip
        if (str_contains($columnType, 'bigint')) {
            return;
        }

        Schema::table('transactions', function (Blueprint $table) {
            // Drop the index first (MySQL requirement)
            $table->dropIndex(['user_id', 'import_id']);

            // Drop the existing import_id column
            $table->dropColumn('import_id');
        });

        // Add the new foreign key in a separate schema call
        Schema::table('transactions', function (Blueprint $table) {
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
