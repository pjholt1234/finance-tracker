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
        // Create accounts table (with final structure - no balance_start_date)
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name', 255);
            $table->integer('number');
            $table->string('sort_code', 20);
            $table->string('description', 500)->nullable();
            $table->integer('balance_at_start')->default(0);
            $table->integer('balance')->default(0);
            $table->timestamps();

            // Ensure user can't have duplicate account numbers
            $table->unique(['user_id', 'number']);
            // Index for performance
            $table->index(['user_id', 'name']);
        });

        // Create CSV schemas table (with final integer column structure)
        Schema::create('csv_schemas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name', 255); // User-friendly name for the schema
            $table->integer('transaction_data_start'); // Row where transaction data starts (1-indexed)

            // Column mappings - store column indices (1-indexed column numbers)
            $table->integer('date_column');
            $table->integer('balance_column');
            $table->integer('amount_column')->nullable(); // For single amount column
            $table->integer('paid_in_column')->nullable(); // For separate paid in column
            $table->integer('paid_out_column')->nullable(); // For separate paid out column
            $table->integer('description_column')->nullable(); // Optional description column

            // Date format detection/storage
            $table->string('date_format', 50)->nullable(); // e.g., 'MM/DD/YYYY', 'YYYY-MM-DD'

            $table->timestamps();

            // Ensure user can't have duplicate schema names
            $table->unique(['user_id', 'name']);
        });

        // Create imports table (with final structure including account_id)
        Schema::create('imports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('account_id')->constrained()->onDelete('cascade');
            $table->foreignId('csv_schema_id')->constrained()->onDelete('cascade');
            $table->string('filename', 255);
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->integer('total_rows')->nullable();
            $table->integer('processed_rows')->default(0);
            $table->integer('imported_rows')->default(0);
            $table->integer('duplicate_rows')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['csv_schema_id']);
            $table->index(['account_id']);
        });

        // Create transactions table (with final structure: date type, integer amounts, account_id, reference)
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('account_id')->constrained()->onDelete('cascade');

            // Transaction data (final structure)
            $table->date('date'); // Standard SQL date format (Y-m-d)
            $table->integer('balance')->nullable(); // Balance in pennies
            $table->integer('paid_in')->nullable(); // Paid in amount in pennies
            $table->integer('paid_out')->nullable(); // Paid out amount in pennies
            $table->text('description')->nullable(); // Transaction description
            $table->text('reference')->nullable(); // Transaction reference

            // Import tracking
            $table->string('import_id', 100); // UUID or identifier for the import batch

            // Duplicate prevention - MySQL has key length limits
            $table->string('unique_hash', 64)->unique(); // Hash of user_id + date + balance + paid_in + paid_out

            $table->timestamps();

            // Indexes for performance
            $table->index(['user_id', 'date']);
            $table->index(['user_id', 'import_id']);
            $table->index(['account_id', 'date']);
        });

        // Create tags table (with final structure including archived)
        Schema::create('tags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name', 255);
            $table->string('color', 7)->nullable(); // Hex color for UI display
            $table->text('description')->nullable();
            $table->boolean('archived')->default(false);
            $table->timestamps();

            // Ensure user can't have duplicate tag names
            $table->unique(['user_id', 'name']);
        });

        // Create tag criterias table (final structure - no unique constraint on tag_id+type)
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
            $table->string('value', 500)->nullable(); // For description, exact amount, exact date
            $table->decimal('value_to', 15, 2)->nullable(); // For amount ranges (max value)
            $table->integer('day_of_month')->nullable(); // For day_of_month (1-31)
            $table->integer('day_of_week')->nullable(); // For day_of_week (1-7, Monday=1)

            // Logic type for combining multiple criteria (AND/OR)
            $table->enum('logic_type', ['and', 'or'])->default('and');

            $table->timestamps();

            // Performance indexes
            $table->index(['tag_id', 'type']);
            $table->index(['tag_id', 'match_type']);
        });

        // Create tag_transaction pivot table (final structure)
        Schema::create('tag_transaction', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tag_id')->constrained()->onDelete('cascade');
            $table->foreignId('transaction_id')->constrained()->onDelete('cascade');

            // Track how the tag was applied
            $table->boolean('is_recommended')->default(false); // Auto-applied based on criteria
            $table->boolean('is_user_added')->default(true); // Manually added by user

            $table->timestamps();

            // Prevent duplicate tag assignments
            $table->unique(['tag_id', 'transaction_id']);

            // Performance indexes
            $table->index(['tag_id']);
            $table->index(['transaction_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop tables in reverse order to handle foreign key constraints
        Schema::dropIfExists('tag_transaction');
        Schema::dropIfExists('tag_criterias');
        Schema::dropIfExists('tags');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('imports');
        Schema::dropIfExists('csv_schemas');
        Schema::dropIfExists('accounts');
    }
};
