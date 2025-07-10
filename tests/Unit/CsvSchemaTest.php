<?php

namespace Tests\Unit;

use App\Models\CsvSchema;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class CsvSchemaTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_csv_schema_can_be_created_with_amount_column(): void
    {
        $schema = CsvSchema::create([
            'user_id' => $this->user->id,
            'name' => 'Test Schema',
            'transaction_data_start' => 2,
            'date_column' => 1,
            'balance_column' => 2,
            'amount_column' => 3,
            'description_column' => 4,
            'date_format' => 'MM/DD/YYYY',
        ]);

        $this->assertDatabaseHas('csv_schemas', [
            'user_id' => $this->user->id,
            'name' => 'Test Schema',
            'amount_column' => 3,
        ]);

        $this->assertTrue($schema->usesSingleAmountColumn());
        $this->assertFalse($schema->usesSeparateAmountColumns());
    }

    public function test_csv_schema_can_be_created_with_separate_amount_columns(): void
    {
        $schema = CsvSchema::create([
            'user_id' => $this->user->id,
            'name' => 'Test Schema',
            'transaction_data_start' => 2,
            'date_column' => 1,
            'balance_column' => 2,
            'paid_in_column' => 3,
            'paid_out_column' => 4,
            'description_column' => 5,
        ]);

        $this->assertDatabaseHas('csv_schemas', [
            'user_id' => $this->user->id,
            'name' => 'Test Schema',
            'paid_in_column' => 3,
            'paid_out_column' => 4,
        ]);

        $this->assertFalse($schema->usesSingleAmountColumn());
        $this->assertTrue($schema->usesSeparateAmountColumns());
    }

    public function test_schema_validation_passes_with_amount_column(): void
    {
        $schema = new CsvSchema([
            'user_id' => $this->user->id,
            'name' => 'Test Schema',
            'transaction_data_start' => 1,
            'date_column' => 1,
            'balance_column' => 2,
            'amount_column' => 3,
        ]);

        // Should not throw exception
        $schema->validateSchema();
        $this->assertTrue(true); // If we get here, validation passed
    }

    public function test_schema_validation_passes_with_separate_columns(): void
    {
        $schema = new CsvSchema([
            'user_id' => $this->user->id,
            'name' => 'Test Schema',
            'transaction_data_start' => 1,
            'date_column' => 1,
            'balance_column' => 2,
            'paid_in_column' => 3,
            'paid_out_column' => 4,
        ]);

        // Should not throw exception
        $schema->validateSchema();
        $this->assertTrue(true); // If we get here, validation passed
    }

    public function test_schema_validation_fails_without_amount_columns(): void
    {
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Either amount column or paid_in/paid_out columns must be defined.');

        $schema = new CsvSchema([
            'user_id' => $this->user->id,
            'name' => 'Test Schema',
            'transaction_data_start' => 1,
            'date_column' => 1,
            'balance_column' => 2,
        ]);

        $schema->validateSchema();
    }

    public function test_schema_validation_fails_without_date_column(): void
    {
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Date column is required.');

        $schema = new CsvSchema([
            'user_id' => $this->user->id,
            'name' => 'Test Schema',
            'transaction_data_start' => 1,
            'balance_column' => 2,
            'amount_column' => 3,
        ]);

        $schema->validateSchema();
    }

    public function test_schema_validation_fails_without_balance_column(): void
    {
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Balance column is required.');

        $schema = new CsvSchema([
            'user_id' => $this->user->id,
            'name' => 'Test Schema',
            'transaction_data_start' => 1,
            'date_column' => 1,
            'amount_column' => 3,
        ]);

        $schema->validateSchema();
    }

    public function test_schema_validation_fails_with_invalid_start_row(): void
    {
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Transaction data start row must be 1 or greater.');

        $schema = new CsvSchema([
            'user_id' => $this->user->id,
            'name' => 'Test Schema',
            'transaction_data_start' => 0,
            'date_column' => 1,
            'balance_column' => 2,
            'amount_column' => 3,
        ]);

        $schema->validateSchema();
    }

    public function test_get_column_mapping_with_amount_column(): void
    {
        $schema = new CsvSchema([
            'date_column' => 1,
            'balance_column' => 2,
            'amount_column' => 3,
            'description_column' => 4,
        ]);

        $mapping = $schema->getColumnMapping();

        $this->assertEquals([
            'date' => 1,
            'balance' => 2,
            'amount' => 3,
            'description' => 4,
        ], $mapping);
    }

    public function test_get_column_mapping_with_separate_columns(): void
    {
        $schema = new CsvSchema([
            'date_column' => 1,
            'balance_column' => 2,
            'paid_in_column' => 3,
            'paid_out_column' => 4,
            'description_column' => 5,
        ]);

        $mapping = $schema->getColumnMapping();

        $this->assertEquals([
            'date' => 1,
            'balance' => 2,
            'paid_in' => 3,
            'paid_out' => 4,
            'description' => 5,
        ], $mapping);
    }

    public function test_user_relationship(): void
    {
        $schema = CsvSchema::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $this->assertTrue($schema->user->is($this->user));
    }

    public function test_unique_constraint_on_user_and_name(): void
    {
        CsvSchema::create([
            'user_id' => $this->user->id,
            'name' => 'Test Schema',
            'transaction_data_start' => 1,
            'date_column' => 1,
            'balance_column' => 2,
            'amount_column' => 3,
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        CsvSchema::create([
            'user_id' => $this->user->id,
            'name' => 'Test Schema', // Same name for same user
            'transaction_data_start' => 1,
            'date_column' => 1,
            'balance_column' => 2,
            'amount_column' => 3,
        ]);
    }
}
