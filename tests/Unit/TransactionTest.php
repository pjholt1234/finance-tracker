<?php

namespace Tests\Unit;

use App\Models\Account;
use App\Models\Import;
use App\Models\Tag;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Account $account;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->account = Account::factory()->create(['user_id' => $this->user->id]);
    }

    public function test_transaction_can_be_created(): void
    {
        $import = Import::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
        ]);

        $transaction = Transaction::create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
            'date' => '2023-01-01',
            'balance' => 100000, // £1000.00 in pennies
            'paid_in' => 10000, // £100.00 in pennies
            'paid_out' => null,
            'description' => 'Test transaction',
            'import_id' => $import->id,
        ]);

        $this->assertDatabaseHas('transactions', [
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
            'import_id' => $import->id,
        ]);

        // Check the date separately since it might include time component
        $this->assertEquals('2023-01-01', $transaction->date->format('Y-m-d'));
        $this->assertNotNull($transaction->unique_hash);
    }

    public function test_unique_hash_is_generated_automatically(): void
    {
        $import = Import::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
        ]);

        $transaction = new Transaction([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
            'date' => '2023-01-01',
            'balance' => 100000, // £1000.00 in pennies
            'paid_in' => 10000, // £100.00 in pennies
            'paid_out' => null,
            'description' => 'Test transaction',
            'import_id' => $import->id,
        ]);

        $transaction->save();

        $this->assertNotNull($transaction->unique_hash);
        $this->assertNotEmpty($transaction->unique_hash);
    }

    public function test_generate_unique_hash_creates_consistent_hash()
    {
        $userId = 1;
        $date = '2023-01-01';
        $balance = 100000; // £1000.00 in pennies
        $paidIn = 10000; // £100.00 in pennies
        $paidOut = null;

        $hash1 = Transaction::generateUniqueHash($userId, $date, $balance, $paidIn, $paidOut);
        $hash2 = Transaction::generateUniqueHash($userId, $date, $balance, $paidIn, $paidOut);

        $this->assertEquals($hash1, $hash2);
    }

    public function test_generate_unique_hash_creates_different_hash_for_different_data()
    {
        $userId = 1;
        $date = '2023-01-01';
        $balance1 = 100000; // £1000.00 in pennies
        $balance2 = 200000; // £2000.00 in pennies
        $paidIn = 10000; // £100.00 in pennies
        $paidOut = null;

        $hash1 = Transaction::generateUniqueHash($userId, $date, $balance1, $paidIn, $paidOut);
        $hash2 = Transaction::generateUniqueHash($userId, $date, $balance2, $paidIn, $paidOut);

        $this->assertNotEquals($hash1, $hash2);
    }

    public function test_exists_by_hash_returns_true_for_existing_transaction(): void
    {
        $import = Import::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
        ]);

        $transaction = Transaction::create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
            'date' => '2023-01-01',
            'balance' => 100000, // £1000.00 in pennies
            'paid_in' => 10000, // £100.00 in pennies
            'paid_out' => null,
            'description' => 'Test transaction',
            'import_id' => $import->id,
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
            'account_id' => $this->account->id,
        ]);

        $this->assertTrue($transaction->user->is($this->user));
    }

    public function test_tags_relationship(): void
    {
        $transaction = Transaction::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
        ]);

        $tag = Tag::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $transaction->tags()->attach($tag->id, [
            'is_recommended' => false,
            'is_user_added' => true,
        ]);

        $this->assertTrue($transaction->tags->contains($tag));
        $this->assertEquals(false, $transaction->tags->first()->pivot->is_recommended);
        $this->assertEquals(true, $transaction->tags->first()->pivot->is_user_added);
    }

    public function test_for_user_scope(): void
    {
        $otherUser = User::factory()->create();
        $otherAccount = Account::factory()->create(['user_id' => $otherUser->id]);

        $userTransaction = Transaction::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
        ]);

        $otherUserTransaction = Transaction::factory()->create([
            'user_id' => $otherUser->id,
            'account_id' => $otherAccount->id,
        ]);

        $userTransactions = Transaction::forUser($this->user->id)->get();

        $this->assertTrue($userTransactions->contains($userTransaction));
        $this->assertFalse($userTransactions->contains($otherUserTransaction));
    }

    public function test_for_import_scope(): void
    {
        $import1 = Import::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
        ]);
        $import2 = Import::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
        ]);

        $import1Transaction = Transaction::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
            'import_id' => $import1->id,
        ]);

        $import2Transaction = Transaction::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
            'import_id' => $import2->id,
        ]);

        $import1Transactions = Transaction::forImport($import1->id)->get();

        $this->assertTrue($import1Transactions->contains($import1Transaction));
        $this->assertFalse($import1Transactions->contains($import2Transaction));
    }

    public function test_duplicate_unique_hash_throws_exception(): void
    {
        $import = Import::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
        ]);

        $transactionData = [
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
            'date' => '2023-01-01',
            'balance' => 100000, // £1000.00 in pennies
            'paid_in' => 10000, // £100.00 in pennies
            'paid_out' => null,
            'description' => 'Test transaction',
            'import_id' => $import->id,
        ];

        // Create first transaction
        Transaction::create($transactionData);

        // Attempt to create second transaction with same data (should fail due to unique constraint)
        $this->expectException(\Illuminate\Database\QueryException::class);
        Transaction::create($transactionData);
    }

    public function test_formatted_date_attribute(): void
    {
        $transaction = Transaction::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
            'date' => '2023-01-15',
        ]);

        $this->assertEquals('15/01/2023', $transaction->formatted_date);
    }
}
