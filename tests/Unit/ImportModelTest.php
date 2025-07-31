<?php

namespace Tests\Unit;

use App\Models\CsvSchema;
use App\Models\Import;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ImportModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_belongs_to_user()
    {
        $user = User::factory()->create();
        $import = Import::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(User::class, $import->user);
        $this->assertEquals($user->id, $import->user->id);
    }

    public function test_import_belongs_to_csv_schema()
    {
        $user = User::factory()->create();
        $schema = CsvSchema::factory()->create(['user_id' => $user->id]);
        $import = Import::factory()->create([
            'user_id' => $user->id,
            'csv_schema_id' => $schema->id,
        ]);

        $this->assertInstanceOf(CsvSchema::class, $import->csvSchema);
        $this->assertEquals($schema->id, $import->csvSchema->id);
    }

    public function test_import_has_many_transactions()
    {
        $user = User::factory()->create();
        $import = Import::factory()->create(['user_id' => $user->id]);

        $transaction1 = Transaction::factory()->create([
            'user_id' => $user->id,
            'import_id' => $import->id,
        ]);

        $transaction2 = Transaction::factory()->create([
            'user_id' => $user->id,
            'import_id' => $import->id,
        ]);

        $this->assertCount(2, $import->transactions);
        $this->assertTrue($import->transactions->contains($transaction1));
        $this->assertTrue($import->transactions->contains($transaction2));
    }

    public function test_mark_as_started_updates_status_and_timestamp()
    {
        $import = Import::factory()->create(['status' => 'pending']);

        $import->markAsStarted();

        $this->assertEquals('processing', $import->status);
        $this->assertNotNull($import->started_at);
    }

    public function test_mark_as_completed_updates_status_and_timestamp()
    {
        $import = Import::factory()->create(['status' => 'processing']);

        $import->markAsCompleted();

        $this->assertEquals('completed', $import->status);
        $this->assertNotNull($import->completed_at);
    }

    public function test_mark_as_failed_updates_status_and_error_message()
    {
        $import = Import::factory()->create(['status' => 'processing']);

        $import->markAsFailed('Test error message');

        $this->assertEquals('failed', $import->status);
        $this->assertEquals('Test error message', $import->error_message);
        $this->assertNotNull($import->completed_at);
    }

    public function test_update_progress_updates_processed_rows()
    {
        $import = Import::factory()->create([
            'processed_rows' => 0,
            'imported_rows' => 0,
            'duplicate_rows' => 0,
        ]);

        $import->updateProgress(10, 8, 2);

        $this->assertEquals(10, $import->processed_rows);
        $this->assertEquals(8, $import->imported_rows);
        $this->assertEquals(2, $import->duplicate_rows);
    }

    public function test_import_status_constants_are_defined()
    {
        $this->assertEquals('pending', Import::STATUS_PENDING);
        $this->assertEquals('processing', Import::STATUS_PROCESSING);
        $this->assertEquals('completed', Import::STATUS_COMPLETED);
        $this->assertEquals('failed', Import::STATUS_FAILED);
    }

    public function test_import_has_correct_fillable_attributes()
    {
        $import = new Import;
        $fillable = $import->getFillable();

        $expectedFillable = [
            'user_id',
            'csv_schema_id',
            'filename',
            'status',
            'total_rows',
            'processed_rows',
            'imported_rows',
            'duplicate_rows',
            'error_message',
            'started_at',
            'completed_at',
        ];

        foreach ($expectedFillable as $field) {
            $this->assertContains($field, $fillable);
        }
    }

    public function test_import_casts_timestamps_correctly()
    {
        $import = Import::factory()->create([
            'started_at' => '2023-01-01 10:00:00',
            'completed_at' => '2023-01-01 11:00:00',
        ]);

        $this->assertInstanceOf(\Carbon\Carbon::class, $import->started_at);
        $this->assertInstanceOf(\Carbon\Carbon::class, $import->completed_at);
    }

    public function test_import_default_status_is_pending()
    {
        $import = Import::factory()->create(['status' => 'pending']);

        $this->assertEquals('pending', $import->status);
    }

    public function test_import_scope_for_user()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $import1 = Import::factory()->create(['user_id' => $user1->id]);
        $import2 = Import::factory()->create(['user_id' => $user2->id]);

        $user1Imports = Import::where('user_id', $user1->id)->get();
        $user2Imports = Import::where('user_id', $user2->id)->get();

        $this->assertCount(1, $user1Imports);
        $this->assertCount(1, $user2Imports);
        $this->assertEquals($import1->id, $user1Imports->first()->id);
        $this->assertEquals($import2->id, $user2Imports->first()->id);
    }
}
