<?php

namespace Tests\Unit;

use App\Models\Account;
use App\Models\CsvSchema;
use App\Models\Import;
use App\Models\Tag;
use App\Models\Transaction;
use App\Models\User;
use App\Services\CsvImportService;
use App\Services\DateParsingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class CsvImportServiceTest extends TestCase
{
    use RefreshDatabase;

    private CsvImportService $csvImportService;

    protected function setUp(): void
    {
        parent::setUp();
        $dateParsingService = new DateParsingService;
        $this->csvImportService = new CsvImportService($dateParsingService);
    }

    public function test_extract_transaction_data_with_single_amount_column()
    {
        $user = User::factory()->create();
        $schema = CsvSchema::factory()->create([
            'user_id' => $user->id,
            'date_column' => 1,
            'balance_column' => 2,
            'amount_column' => 3,
            'description_column' => 4,
        ]);

        $row = ['2023-01-01', '1000.00', '100.00', 'Test Transaction'];

        $result = $this->csvImportService->extractTransactionData($row, $schema, $user->id);

        $this->assertEquals('2023-01-01', $result['date']);
        $this->assertEquals(100000, $result['balance']); // £1000.00 in pennies
        $this->assertEquals(10000, $result['paid_in']); // £100.00 in pennies
        $this->assertNull($result['paid_out']);
        $this->assertEquals('Test Transaction', $result['description']);
        $this->assertNotEmpty($result['unique_hash']);
    }

    public function test_extract_transaction_data_with_split_amount_columns()
    {
        $user = User::factory()->create();
        $schema = CsvSchema::factory()->create([
            'user_id' => $user->id,
            'date_column' => 1,
            'balance_column' => 2,
            'paid_in_column' => 3,
            'paid_out_column' => 4,
            'description_column' => 5,
        ]);

        $row = ['2023-01-01', '1000.00', '100.00', '', 'Test Transaction'];

        $result = $this->csvImportService->extractTransactionData($row, $schema, $user->id);

        $this->assertEquals('2023-01-01', $result['date']);
        $this->assertEquals(100000, $result['balance']); // £1000.00 in pennies
        $this->assertEquals(10000, $result['paid_in']); // £100.00 in pennies
        $this->assertNull($result['paid_out']);
        $this->assertEquals('Test Transaction', $result['description']);
        $this->assertNotEmpty($result['unique_hash']);
    }

    public function test_extract_transaction_data_generates_unique_hash()
    {
        $user = User::factory()->create();
        $schema = CsvSchema::factory()->create([
            'user_id' => $user->id,
            'date_column' => 1,
            'balance_column' => 2,
            'amount_column' => 3,
            'description_column' => 4,
        ]);

        $row = ['2023-01-01', '1000.00', '100.00', 'Test Transaction'];

        $result = $this->csvImportService->extractTransactionData($row, $schema, $user->id);

        $expectedHash = Transaction::generateUniqueHash($user->id, '2023-01-01', 100000, 10000, null);
        $this->assertEquals($expectedHash, $result['unique_hash']);
    }

    public function test_extract_transaction_data_handles_negative_amounts()
    {
        $user = User::factory()->create();
        $schema = CsvSchema::factory()->create([
            'user_id' => $user->id,
            'date_column' => 1,
            'balance_column' => 2,
            'amount_column' => 3,
            'description_column' => 4,
        ]);

        $row = ['2023-01-01', '1000.00', '-100.00', 'Test Transaction'];

        $result = $this->csvImportService->extractTransactionData($row, $schema, $user->id);

        $this->assertEquals('2023-01-01', $result['date']);
        $this->assertEquals(100000, $result['balance']); // £1000.00 in pennies
        $this->assertNull($result['paid_in']);
        $this->assertEquals(10000, $result['paid_out']); // £100.00 in pennies
        $this->assertEquals('Test Transaction', $result['description']);
        $this->assertNotEmpty($result['unique_hash']);
    }

    public function test_extract_transaction_data_handles_column_indices()
    {
        $user = User::factory()->create();
        $schema = CsvSchema::factory()->create([
            'user_id' => $user->id,
            'date_column' => 3,
            'balance_column' => 1,
            'amount_column' => 2,
            'description_column' => 4,
        ]);

        $row = ['1000.00', '100.00', '2023-01-01', 'Test Transaction'];

        $result = $this->csvImportService->extractTransactionData($row, $schema, $user->id);

        $this->assertEquals('2023-01-01', $result['date']);
        $this->assertEquals(100000, $result['balance']); // £1000.00 in pennies
        $this->assertEquals(10000, $result['paid_in']); // £100.00 in pennies
        $this->assertEquals('Test Transaction', $result['description']);
    }

    public function test_extract_transaction_data_handles_different_date_formats()
    {
        $user = User::factory()->create();
        $schema = CsvSchema::factory()->create([
            'user_id' => $user->id,
            'date_column' => 1,
            'balance_column' => 2,
            'amount_column' => 3,
            'description_column' => 4,
            'date_format' => 'd/m/Y',
        ]);

        $row = ['15/01/2023', '1000.00', '100.00', 'Test Transaction'];

        $result = $this->csvImportService->extractTransactionData($row, $schema, $user->id);

        $this->assertEquals('2023-01-15', $result['date']); // Should be converted to Y-m-d format
        $this->assertEquals(100000, $result['balance']);
        $this->assertEquals(10000, $result['paid_in']);
        $this->assertEquals('Test Transaction', $result['description']);
    }

    public function test_get_import_stats_calculates_correctly()
    {
        $user = User::factory()->create();
        $account = Account::factory()->create(['user_id' => $user->id]);
        $schema = CsvSchema::factory()->create(['user_id' => $user->id]);

        $import = Import::factory()->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'csv_schema_id' => $schema->id,
            'total_rows' => 100,
            'processed_rows' => 100,
            'imported_rows' => 80,
            'duplicate_rows' => 10,
        ]);

        $stats = $this->csvImportService->getImportStats($import);

        $this->assertEquals(100, $stats['total_rows']);
        $this->assertEquals(100, $stats['processed_rows']);
        $this->assertEquals(80, $stats['imported_rows']);
        $this->assertEquals(10, $stats['duplicate_rows']);
        $this->assertEquals(0, $stats['error_rows']);
        $this->assertEquals(80.0, $stats['success_rate']);
    }

    public function test_get_import_stats_handles_zero_processed_rows()
    {
        $user = User::factory()->create();
        $account = Account::factory()->create(['user_id' => $user->id]);
        $schema = CsvSchema::factory()->create(['user_id' => $user->id]);

        $import = Import::factory()->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'csv_schema_id' => $schema->id,
            'total_rows' => 0,
            'processed_rows' => 0,
            'imported_rows' => 0,
            'duplicate_rows' => 0,
        ]);

        $stats = $this->csvImportService->getImportStats($import);

        $this->assertEquals(0, $stats['success_rate']);
    }

    public function test_preview_transactions_processes_csv_correctly()
    {
        $user = User::factory()->create();
        $schema = CsvSchema::factory()->create([
            'user_id' => $user->id,
            'date_column' => 'A',
            'balance_column' => 'B',
            'amount_column' => 'C',
            'description_column' => 'D',
            'transaction_data_start' => 2,
        ]);

        $csvContent = "Date,Balance,Amount,Description\n2023-01-01,1000.00,100.00,Test Transaction\n2023-01-02,1100.00,50.00,Another Transaction";
        $file = UploadedFile::fake()->createWithContent('test.csv', $csvContent);

        $result = $this->csvImportService->previewTransactions($file, $schema, $user->id);

        $this->assertEquals(2, count($result['transactions']));
        $this->assertEquals(0, $result['duplicate_count']);
        $this->assertEquals(2, $result['valid_count']);

        // Check that dates are properly parsed
        $this->assertEquals('2023-01-01', $result['transactions'][0]['date']);
        $this->assertEquals('2023-01-02', $result['transactions'][1]['date']);
    }

    public function test_preview_transactions_detects_duplicates()
    {
        $user = User::factory()->create();
        $account = Account::factory()->create(['user_id' => $user->id]);
        $schema = CsvSchema::factory()->create([
            'user_id' => $user->id,
            'date_column' => 1,
            'balance_column' => 2,
            'amount_column' => 3,
            'description_column' => 4,
            'transaction_data_start' => 2,
        ]);

        // Create existing transaction with matching hash
        $existingTransaction = Transaction::factory()->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'date' => '2023-01-01',
            'balance' => 100000, // £1000.00 in pennies
            'paid_in' => 10000, // £100.00 in pennies
            'unique_hash' => Transaction::generateUniqueHash($user->id, '2023-01-01', 100000, 10000, null),
        ]);

        $csvContent = "Date,Balance,Amount,Description\n2023-01-01,1000.00,100.00,\n2023-01-02,1100.00,50.00,Another Transaction";
        $file = UploadedFile::fake()->createWithContent('test.csv', $csvContent);

        $result = $this->csvImportService->previewTransactions($file, $schema, $user->id);

        $this->assertEquals(1, $result['duplicate_count']);
        $this->assertTrue($result['transactions'][0]['is_duplicate']);
        $this->assertFalse($result['transactions'][1]['is_duplicate']);
    }

    public function test_import_reviewed_transactions_creates_import_record()
    {
        $user = User::factory()->create();
        $account = Account::factory()->create(['user_id' => $user->id]);
        $schema = CsvSchema::factory()->create(['user_id' => $user->id]);
        $tag = Tag::factory()->create(['user_id' => $user->id]);

        $transactions = [
            [
                'date' => '2023-01-01',
                'description' => 'Test Transaction',
                'balance' => 100000,
                'paid_in' => 10000,
                'paid_out' => null,
                'reference' => 'REF001',
                'unique_hash' => 'hash1',
                'status' => 'approved',
                'tags' => [$tag->toArray()],
            ],
        ];

        $import = $this->csvImportService->importReviewedTransactions(
            $transactions,
            $schema,
            'test.csv',
            $user,
            $account->id
        );

        $this->assertInstanceOf(Import::class, $import);
        $this->assertEquals($user->id, $import->user_id);
        $this->assertEquals($account->id, $import->account_id);
        $this->assertEquals($schema->id, $import->csv_schema_id);
        $this->assertEquals('test.csv', $import->filename);
        $this->assertEquals('completed', $import->status);
    }

    public function test_import_reviewed_transactions_only_imports_approved()
    {
        $user = User::factory()->create();
        $account = Account::factory()->create(['user_id' => $user->id]);
        $schema = CsvSchema::factory()->create(['user_id' => $user->id]);

        $transactions = [
            [
                'date' => '2023-01-01',
                'description' => 'Approved Transaction',
                'balance' => 100000,
                'paid_in' => 10000,
                'paid_out' => null,
                'reference' => 'REF001',
                'unique_hash' => 'hash1',
                'status' => 'approved',
                'tags' => [],
            ],
            [
                'date' => '2023-01-02',
                'description' => 'Discarded Transaction',
                'balance' => 90000,
                'paid_in' => null,
                'paid_out' => 10000,
                'reference' => 'REF002',
                'unique_hash' => 'hash2',
                'status' => 'discarded',
                'tags' => [],
            ],
        ];

        $import = $this->csvImportService->importReviewedTransactions(
            $transactions,
            $schema,
            'test.csv',
            $user,
            $account->id
        );

        $this->assertEquals(1, $import->imported_rows);
        $this->assertDatabaseHas('transactions', [
            'description' => 'Approved Transaction',
        ]);
        $this->assertDatabaseMissing('transactions', [
            'description' => 'Discarded Transaction',
        ]);
    }

    public function test_import_reviewed_transactions_handles_tag_relationships()
    {
        $user = User::factory()->create();
        $account = Account::factory()->create(['user_id' => $user->id]);
        $schema = CsvSchema::factory()->create(['user_id' => $user->id]);
        $tag1 = Tag::factory()->create(['user_id' => $user->id]);
        $tag2 = Tag::factory()->create(['user_id' => $user->id]);

        $transactions = [
            [
                'date' => '2023-01-01',
                'description' => 'Test Transaction',
                'balance' => 100000,
                'paid_in' => 10000,
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

        $import = $this->csvImportService->importReviewedTransactions(
            $transactions,
            $schema,
            'test.csv',
            $user,
            $account->id
        );

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
}
