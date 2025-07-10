<?php

namespace Tests\Feature;

use App\Models\CsvSchema;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CsvSchemaControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create([
            'two_factor_confirmed_at' => now(), // Enable 2FA to avoid middleware redirect
        ]);
        $this->otherUser = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);
    }

    public function test_authenticated_user_can_clone_their_schema(): void
    {
        $originalSchema = CsvSchema::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Original Schema',
            'transaction_data_start' => 2,
            'date_column' => 1,
            'balance_column' => 2,
            'amount_column' => 3,
            'description_column' => 4,
            'date_format' => 'Y-m-d',
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('csv-schemas.clone', $originalSchema));

        $response->assertRedirect();

        // Check that a new schema was created
        $this->assertDatabaseCount('csv_schemas', 2);

        $clonedSchema = CsvSchema::where('name', 'Original Schema (copy)')->first();
        $this->assertNotNull($clonedSchema);

        // Verify the cloned schema has the same data except for id, name, and timestamps
        $this->assertEquals($this->user->id, $clonedSchema->user_id);
        $this->assertEquals('Original Schema (copy)', $clonedSchema->name);
        $this->assertEquals($originalSchema->transaction_data_start, $clonedSchema->transaction_data_start);
        $this->assertEquals($originalSchema->date_column, $clonedSchema->date_column);
        $this->assertEquals($originalSchema->balance_column, $clonedSchema->balance_column);
        $this->assertEquals($originalSchema->amount_column, $clonedSchema->amount_column);
        $this->assertEquals($originalSchema->description_column, $clonedSchema->description_column);
        $this->assertEquals($originalSchema->date_format, $clonedSchema->date_format);

        // Verify redirect goes to the cloned schema's show page
        $response->assertRedirect(route('csv-schemas.show', $clonedSchema));
    }

    public function test_clone_generates_unique_names_for_multiple_copies(): void
    {
        $originalSchema = CsvSchema::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Test Schema',
        ]);

        // Create first copy
        $this->actingAs($this->user)
            ->post(route('csv-schemas.clone', $originalSchema));

        $this->assertDatabaseHas('csv_schemas', ['name' => 'Test Schema (copy)']);

        // Create second copy
        $this->actingAs($this->user)
            ->post(route('csv-schemas.clone', $originalSchema));

        $this->assertDatabaseHas('csv_schemas', ['name' => 'Test Schema (copy 2)']);

        // Create third copy
        $this->actingAs($this->user)
            ->post(route('csv-schemas.clone', $originalSchema));

        $this->assertDatabaseHas('csv_schemas', ['name' => 'Test Schema (copy 3)']);

        // Should have original + 3 copies = 4 total
        $this->assertDatabaseCount('csv_schemas', 4);
    }

    public function test_clone_works_with_separate_amount_columns(): void
    {
        $originalSchema = CsvSchema::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Separate Amounts Schema',
            'amount_column' => null,
            'paid_in_column' => 3,
            'paid_out_column' => 4,
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('csv-schemas.clone', $originalSchema));

        $response->assertRedirect();

        $clonedSchema = CsvSchema::where('name', 'Separate Amounts Schema (copy)')->first();
        $this->assertNotNull($clonedSchema);
        $this->assertNull($clonedSchema->amount_column);
        $this->assertEquals(3, $clonedSchema->paid_in_column);
        $this->assertEquals(4, $clonedSchema->paid_out_column);
    }

    public function test_clone_preserves_optional_fields(): void
    {
        $originalSchema = CsvSchema::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Full Schema',
            'description_column' => 5,
            'date_format' => 'd/m/Y',
        ]);

        $this->actingAs($this->user)
            ->post(route('csv-schemas.clone', $originalSchema));

        $clonedSchema = CsvSchema::where('name', 'Full Schema (copy)')->first();
        $this->assertNotNull($clonedSchema);
        $this->assertEquals(5, $clonedSchema->description_column);
        $this->assertEquals('d/m/Y', $clonedSchema->date_format);
    }

    public function test_clone_handles_null_optional_fields(): void
    {
        $originalSchema = CsvSchema::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Minimal Schema',
            'description_column' => null,
            'date_format' => null,
        ]);

        $this->actingAs($this->user)
            ->post(route('csv-schemas.clone', $originalSchema));

        $clonedSchema = CsvSchema::where('name', 'Minimal Schema (copy)')->first();
        $this->assertNotNull($clonedSchema);
        $this->assertNull($clonedSchema->description_column);
        $this->assertNull($clonedSchema->date_format);
    }

    public function test_user_cannot_clone_another_users_schema(): void
    {
        $otherUserSchema = CsvSchema::factory()->create([
            'user_id' => $this->otherUser->id,
            'name' => 'Other User Schema',
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('csv-schemas.clone', $otherUserSchema));

        $response->assertForbidden();
        $this->assertDatabaseCount('csv_schemas', 1); // Only the original schema should exist
    }

    public function test_guest_cannot_clone_schema(): void
    {
        $schema = CsvSchema::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Test Schema',
        ]);

        $response = $this->post(route('csv-schemas.clone', $schema));

        $response->assertRedirect('/login');
        $this->assertDatabaseCount('csv_schemas', 1); // Only the original schema should exist
    }

    public function test_clone_returns_404_for_non_existent_schema(): void
    {
        $response = $this->actingAs($this->user)
            ->post(route('csv-schemas.clone', 999));

        $response->assertNotFound();
    }

    public function test_clone_includes_success_message(): void
    {
        $originalSchema = CsvSchema::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Test Schema',
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('csv-schemas.clone', $originalSchema));

        $response->assertRedirect();
        $response->assertSessionHas('success', 'CSV schema cloned successfully.');
    }

    public function test_clone_name_collision_with_existing_copies(): void
    {
        $originalSchema = CsvSchema::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Collision Test',
        ]);

        // Manually create a schema with the expected copy name
        CsvSchema::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Collision Test (copy)',
        ]);

        // Manually create another copy
        CsvSchema::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Collision Test (copy 2)',
        ]);

        // Now clone the original - should create "(copy 3)"
        $this->actingAs($this->user)
            ->post(route('csv-schemas.clone', $originalSchema));

        $this->assertDatabaseHas('csv_schemas', ['name' => 'Collision Test (copy 3)']);
        $this->assertDatabaseCount('csv_schemas', 4); // original + 2 existing copies + 1 new copy
    }
} 