<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\CsvSchema;
use App\Models\Import;
use App\Models\Tag;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TransactionImportTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Account $account;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        // Create a default user with 2FA enabled to avoid middleware redirects
        $this->user = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);

        // Create an account for the user
        $this->account = Account::factory()->create(['user_id' => $this->user->id]);
    }

    public function test_authenticated_user_can_access_import_index()
    {
        $response = $this->actingAs($this->user)->get('/imports');

        $response->assertStatus(200);
    }

    public function test_unauthenticated_user_cannot_access_import_index()
    {
        $response = $this->get('/imports');

        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_access_import_create()
    {
        $response = $this->actingAs($this->user)->get('/imports/create');

        $response->assertStatus(200);
    }

    public function test_user_can_upload_csv_file_for_import()
    {
        $schema = CsvSchema::factory()->create(['user_id' => $this->user->id]);

        $csvContent = "Date,Description,Amount,Balance\n2023-01-01,Test Transaction,100.00,1000.00";
        $file = UploadedFile::fake()->createWithContent('test.csv', $csvContent);

        $response = $this->actingAs($this->user)->post('/imports', [
            'csv_file' => $file,
            'csv_schema_id' => $schema->id,
            'account_id' => $this->account->id,
        ]);

        $response->assertStatus(200); // Now returns the import-review page instead of redirecting
        $response->assertInertia(fn ($page) => $page->component('transactions/import-review'));
    }

    public function test_csv_file_is_required_for_import()
    {
        $schema = CsvSchema::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)->post('/imports', [
            'csv_schema_id' => $schema->id,
        ]);

        $response->assertSessionHasErrors(['csv_file']);
    }

    public function test_csv_schema_id_is_required_for_import()
    {
        $file = UploadedFile::fake()->create('test.csv');

        $response = $this->actingAs($this->user)->post('/imports', [
            'csv_file' => $file,
        ]);

        $response->assertSessionHasErrors(['csv_schema_id']);
    }

    public function test_user_can_only_use_their_own_csv_schema()
    {
        $otherUser = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);
        $otherUserSchema = CsvSchema::factory()->create(['user_id' => $otherUser->id]);

        $file = UploadedFile::fake()->create('test.csv');

        $response = $this->actingAs($this->user)->post('/imports', [
            'csv_file' => $file,
            'csv_schema_id' => $otherUserSchema->id,
            'account_id' => $this->account->id,
        ]);

        $response->assertStatus(403); // Authorization check will throw 403
    }

    public function test_user_can_view_their_own_import()
    {
        $import = Import::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
        ]);

        $response = $this->actingAs($this->user)->get("/imports/{$import->id}");

        $response->assertStatus(200);
    }

    public function test_user_cannot_view_other_users_import()
    {
        $otherUser = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);
        $otherAccount = Account::factory()->create(['user_id' => $otherUser->id]);
        $otherUserImport = Import::factory()->create([
            'user_id' => $otherUser->id,
            'account_id' => $otherAccount->id,
        ]);

        $response = $this->actingAs($this->user)->get("/imports/{$otherUserImport->id}");

        $response->assertStatus(403);
    }

    public function test_user_can_delete_their_own_import()
    {
        $import = Import::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
        ]);

        $response = $this->actingAs($this->user)->delete("/imports/{$import->id}");

        $response->assertRedirect('/imports');
        $this->assertDatabaseMissing('imports', ['id' => $import->id]);
    }

    public function test_user_cannot_delete_other_users_import()
    {
        $otherUser = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);
        $otherAccount = Account::factory()->create(['user_id' => $otherUser->id]);
        $otherUserImport = Import::factory()->create([
            'user_id' => $otherUser->id,
            'account_id' => $otherAccount->id,
        ]);

        $response = $this->actingAs($this->user)->delete("/imports/{$otherUserImport->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('imports', ['id' => $otherUserImport->id]);
    }

    public function test_import_finalize_with_valid_transactions()
    {
        $schema = CsvSchema::factory()->create(['user_id' => $this->user->id]);
        $tag = Tag::factory()->create(['user_id' => $this->user->id]);

        // Create a fake temporary file
        Storage::disk('local')->put('temp/test.csv', 'fake content');

        $transactions = [
            [
                'date' => '2023-01-01',
                'description' => 'Test Transaction',
                'balance' => 100000, // £1000.00 in pennies
                'paid_in' => 10000, // £100.00 in pennies
                'paid_out' => null,
                'reference' => 'REF001',
                'unique_hash' => 'hash1',
                'status' => 'approved',
                'tags' => [['id' => $tag->id]],
            ],
        ];

        $response = $this->actingAs($this->user)->post('/imports/finalize', [
            'transactions' => json_encode($transactions),
            'schema_id' => $schema->id,
            'filename' => 'test.csv',
            'temp_path' => 'temp/test.csv',
            'account_id' => $this->account->id,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('imports', [
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
            'csv_schema_id' => $schema->id,
            'filename' => 'test.csv',
        ]);
    }

    public function test_import_finalize_only_imports_approved_transactions()
    {
        $schema = CsvSchema::factory()->create(['user_id' => $this->user->id]);

        // Create a fake temporary file
        Storage::disk('local')->put('temp/test.csv', 'fake content');

        $transactions = [
            [
                'date' => '2023-01-01',
                'description' => 'Approved Transaction',
                'balance' => 100000, // £1000.00 in pennies
                'paid_in' => 10000, // £100.00 in pennies
                'paid_out' => null,
                'reference' => 'REF001',
                'unique_hash' => 'hash1',
                'status' => 'approved',
                'tags' => [],
            ],
            [
                'date' => '2023-01-02',
                'description' => 'Discarded Transaction',
                'balance' => 90000, // £900.00 in pennies
                'paid_in' => null,
                'paid_out' => 10000, // £100.00 in pennies
                'reference' => 'REF002',
                'unique_hash' => 'hash2',
                'status' => 'discarded',
                'tags' => [],
            ],
        ];

        $response = $this->actingAs($this->user)->post('/imports/finalize', [
            'transactions' => json_encode($transactions),
            'schema_id' => $schema->id,
            'filename' => 'test.csv',
            'temp_path' => 'temp/test.csv',
            'account_id' => $this->account->id,
        ]);

        $response->assertRedirect();

        // Only approved transaction should be imported
        $this->assertDatabaseHas('transactions', [
            'description' => 'Approved Transaction',
        ]);

        $this->assertDatabaseMissing('transactions', [
            'description' => 'Discarded Transaction',
        ]);
    }

    public function test_import_finalize_validates_tag_ownership()
    {
        $otherUser = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);
        $schema = CsvSchema::factory()->create(['user_id' => $this->user->id]);
        $otherUserTag = Tag::factory()->create(['user_id' => $otherUser->id]);

        // Create a fake temporary file
        Storage::disk('local')->put('temp/test.csv', 'fake content');

        $transactions = [
            [
                'date' => '2023-01-01',
                'description' => 'Test Transaction',
                'balance' => 100000, // £1000.00 in pennies
                'paid_in' => 10000, // £100.00 in pennies
                'paid_out' => null,
                'reference' => 'REF001',
                'unique_hash' => 'hash1',
                'status' => 'approved',
                'tags' => [['id' => $otherUserTag->id]], // Using another user's tag
            ],
        ];

        $response = $this->actingAs($this->user)->post('/imports/finalize', [
            'transactions' => json_encode($transactions),
            'schema_id' => $schema->id,
            'filename' => 'test.csv',
            'temp_path' => 'temp/test.csv',
            'account_id' => $this->account->id,
        ]);

        $response->assertRedirect(); // Should redirect back with errors
        $response->assertSessionHasErrors(); // Should have validation errors
    }

    public function test_import_creates_transaction_tag_relationships()
    {
        $schema = CsvSchema::factory()->create(['user_id' => $this->user->id]);
        $tag1 = Tag::factory()->create(['user_id' => $this->user->id]);
        $tag2 = Tag::factory()->create(['user_id' => $this->user->id]);

        // Create a fake temporary file
        Storage::disk('local')->put('temp/test.csv', 'fake content');

        $transactions = [
            [
                'date' => '2023-01-01',
                'description' => 'Test Transaction',
                'balance' => 100000, // £1000.00 in pennies
                'paid_in' => 10000, // £100.00 in pennies
                'paid_out' => null,
                'reference' => 'REF001',
                'unique_hash' => 'hash1',
                'status' => 'approved',
                'tags' => [
                    ['id' => $tag1->id],
                    ['id' => $tag2->id],
                ],
            ],
        ];

        $response = $this->actingAs($this->user)->post('/imports/finalize', [
            'transactions' => json_encode($transactions),
            'schema_id' => $schema->id,
            'filename' => 'test.csv',
            'temp_path' => 'temp/test.csv',
            'account_id' => $this->account->id,
        ]);

        $response->assertRedirect();

        $transaction = Transaction::where('description', 'Test Transaction')->first();
        $this->assertNotNull($transaction);

        $this->assertDatabaseHas('tag_transaction', [
            'transaction_id' => $transaction->id,
            'tag_id' => $tag1->id,
        ]);

        $this->assertDatabaseHas('tag_transaction', [
            'transaction_id' => $transaction->id,
            'tag_id' => $tag2->id,
        ]);
    }

    public function test_import_handles_duplicate_transactions()
    {
        $schema = CsvSchema::factory()->create(['user_id' => $this->user->id]);

        // Create existing transaction
        $existingTransaction = Transaction::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
            'unique_hash' => 'duplicate_hash',
        ]);

        $transactions = [
            [
                'date' => '2023-01-01',
                'description' => 'Duplicate Transaction',
                'balance' => 100000, // £1000.00 in pennies
                'paid_in' => 10000, // £100.00 in pennies
                'paid_out' => null,
                'reference' => 'REF001',
                'unique_hash' => 'duplicate_hash', // Same hash as existing transaction
                'status' => 'approved',
                'tags' => [],
            ],
        ];

        $response = $this->actingAs($this->user)->post('/imports/finalize', [
            'transactions' => json_encode($transactions),
            'schema_id' => $schema->id,
            'filename' => 'test.csv',
            'temp_path' => 'temp/test.csv',
            'account_id' => $this->account->id,
        ]);

        $response->assertRedirect();

        // Should not create duplicate transaction
        $this->assertEquals(1, Transaction::where('unique_hash', 'duplicate_hash')->count());
    }
}
