<?php

namespace Tests\Unit;

use App\Models\Transaction;
use App\Models\User;
use App\Models\Tag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_transaction_can_be_created(): void
    {
        $transaction = Transaction::create([
            'user_id' => $this->user->id,
            'date' => 'encrypted_date_string',
            'balance' => 'encrypted_balance_string',
            'paid_in' => 'encrypted_paid_in_string',
            'paid_out' => 'encrypted_paid_out_string',
            'description' => 'encrypted_description_string',
            'import_id' => 'import_123',
        ]);

        $this->assertDatabaseHas('transactions', [
            'user_id' => $this->user->id,
            'import_id' => 'import_123',
        ]);

        $this->assertNotNull($transaction->unique_hash);
    }

    public function test_unique_hash_is_generated_automatically(): void
    {
        $transaction = new Transaction([
            'user_id' => $this->user->id,
            'date' => 'encrypted_date_string',
            'balance' => 'encrypted_balance_string',
            'paid_in' => 'encrypted_paid_in_string',
            'paid_out' => 'encrypted_paid_out_string',
            'import_id' => 'import_123',
        ]);

        $transaction->save();

        $this->assertNotNull($transaction->unique_hash);
        $this->assertNotEmpty($transaction->unique_hash);
    }

    public function test_generate_unique_hash_creates_consistent_hash(): void
    {
        $hash1 = Transaction::generateUniqueHash(
            $this->user->id,
            'encrypted_date',
            'encrypted_balance',
            'encrypted_paid_in',
            'encrypted_paid_out'
        );

        $hash2 = Transaction::generateUniqueHash(
            $this->user->id,
            'encrypted_date',
            'encrypted_balance',
            'encrypted_paid_in',
            'encrypted_paid_out'
        );

        $this->assertEquals($hash1, $hash2);
    }

    public function test_generate_unique_hash_creates_different_hash_for_different_data(): void
    {
        $hash1 = Transaction::generateUniqueHash(
            $this->user->id,
            'encrypted_date_1',
            'encrypted_balance',
            'encrypted_paid_in',
            'encrypted_paid_out'
        );

        $hash2 = Transaction::generateUniqueHash(
            $this->user->id,
            'encrypted_date_2',
            'encrypted_balance',
            'encrypted_paid_in',
            'encrypted_paid_out'
        );

        $this->assertNotEquals($hash1, $hash2);
    }

    public function test_exists_by_hash_returns_true_for_existing_transaction(): void
    {
        $transaction = Transaction::create([
            'user_id' => $this->user->id,
            'date' => 'encrypted_date_string',
            'balance' => 'encrypted_balance_string',
            'paid_in' => 'encrypted_paid_in_string',
            'paid_out' => 'encrypted_paid_out_string',
            'import_id' => 'import_123',
        ]);

        $this->assertTrue(Transaction::existsByHash($transaction->unique_hash));
    }

    public function test_exists_by_hash_returns_false_for_non_existing_hash(): void
    {
        $nonExistentHash = 'non_existent_hash_value';
        
        $this->assertFalse(Transaction::existsByHash($nonExistentHash));
    }

    public function test_user_relationship(): void
    {
        $transaction = Transaction::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $this->assertTrue($transaction->user->is($this->user));
    }

    public function test_tags_relationship(): void
    {
        $transaction = Transaction::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $tag = Tag::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $transaction->tags()->attach($tag->id, [
            'auto_applied' => false,
        ]);

        $this->assertTrue($transaction->tags->contains($tag));
        $this->assertEquals(0, $transaction->tags->first()->pivot->auto_applied);
    }

    public function test_for_user_scope(): void
    {
        $otherUser = User::factory()->create();

        $userTransaction = Transaction::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $otherUserTransaction = Transaction::factory()->create([
            'user_id' => $otherUser->id,
        ]);

        $userTransactions = Transaction::forUser($this->user->id)->get();

        $this->assertTrue($userTransactions->contains($userTransaction));
        $this->assertFalse($userTransactions->contains($otherUserTransaction));
    }

    public function test_for_import_scope(): void
    {
        $import1Transaction = Transaction::factory()->create([
            'user_id' => $this->user->id,
            'import_id' => 'import_1',
        ]);

        $import2Transaction = Transaction::factory()->create([
            'user_id' => $this->user->id,
            'import_id' => 'import_2',
        ]);

        $import1Transactions = Transaction::forImport('import_1')->get();

        $this->assertTrue($import1Transactions->contains($import1Transaction));
        $this->assertFalse($import1Transactions->contains($import2Transaction));
    }

    public function test_duplicate_unique_hash_throws_exception(): void
    {
        $transactionData = [
            'user_id' => $this->user->id,
            'date' => 'encrypted_date_string',
            'balance' => 'encrypted_balance_string',
            'paid_in' => 'encrypted_paid_in_string',
            'paid_out' => 'encrypted_paid_out_string',
            'import_id' => 'import_123',
        ];

        // Create first transaction
        Transaction::create($transactionData);

        // Attempt to create duplicate should fail
        $this->expectException(\Illuminate\Database\QueryException::class);
        Transaction::create($transactionData);
    }
}
