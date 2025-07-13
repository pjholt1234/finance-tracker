<?php

namespace Tests\Unit;

use App\Models\Account;
use App\Models\Import;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountModelTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_account_can_be_created(): void
    {
        $account = Account::create([
            'user_id' => $this->user->id,
            'name' => 'Test Account',
            'number' => 12345678,
            'sort_code' => '12-34-56',
            'description' => 'Test description',
            'balance_at_start' => 100000, // £1000 in pence
            'balance' => 100000,
        ]);

        $this->assertDatabaseHas('accounts', [
            'user_id' => $this->user->id,
            'name' => 'Test Account',
            'number' => 12345678,
            'sort_code' => '12-34-56',
        ]);

        $this->assertEquals('Test Account', $account->name);
        $this->assertEquals(12345678, $account->number);
        $this->assertEquals('12-34-56', $account->sort_code);
        $this->assertEquals(100000, $account->balance_at_start);
        $this->assertEquals(100000, $account->balance);
    }

    public function test_account_belongs_to_user(): void
    {
        $account = Account::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $this->assertInstanceOf(User::class, $account->user);
        $this->assertEquals($this->user->id, $account->user->id);
    }

    public function test_account_has_many_imports(): void
    {
        $account = Account::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $import1 = Import::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $account->id,
        ]);

        $import2 = Import::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $account->id,
        ]);

        $this->assertCount(2, $account->imports);
        $this->assertTrue($account->imports->contains($import1));
        $this->assertTrue($account->imports->contains($import2));
    }

    public function test_account_has_many_transactions(): void
    {
        $account = Account::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $import = Import::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $account->id,
        ]);

        $transaction1 = Transaction::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $account->id,
            'import_id' => $import->id,
        ]);

        $transaction2 = Transaction::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $account->id,
            'import_id' => $import->id,
        ]);

        $this->assertCount(2, $account->transactions);
        $this->assertTrue($account->transactions->contains($transaction1));
        $this->assertTrue($account->transactions->contains($transaction2));
    }

    public function test_for_user_scope(): void
    {
        $otherUser = User::factory()->create();

        $userAccount = Account::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $otherUserAccount = Account::factory()->create([
            'user_id' => $otherUser->id,
        ]);

        $userAccounts = Account::forUser($this->user->id)->get();

        $this->assertTrue($userAccounts->contains($userAccount));
        $this->assertFalse($userAccounts->contains($otherUserAccount));
    }

    public function test_formatted_balance_attribute(): void
    {
        $account = Account::factory()->create([
            'balance' => 123456, // £1234.56 in pence
        ]);

        $this->assertEquals('1,234.56', $account->formatted_balance);
    }

    public function test_formatted_balance_at_start_attribute(): void
    {
        $account = Account::factory()->create([
            'balance_at_start' => 98765, // £987.65 in pence
        ]);

        $this->assertEquals('987.65', $account->formatted_balance_at_start);
    }

    public function test_update_balance_uses_most_recent_transaction_balance(): void
    {
        $account = Account::factory()->create([
            'user_id' => $this->user->id,
            'balance_at_start' => 100000, // £1000
            'balance' => 100000,
        ]);

        $import = Import::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $account->id,
        ]);

        // Create transactions with balance field (like from CSV import)
        Transaction::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $account->id,
            'import_id' => $import->id,
            'date' => '2023-01-01',
            'balance' => 125000, // £1250.00 in pennies
            'paid_in' => 25000, // £250.00 in pennies
            'paid_out' => null,
        ]);

        Transaction::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $account->id,
            'import_id' => $import->id,
            'date' => '2023-01-02', // Later date, so this is most recent
            'balance' => 120000, // £1200.00 in pennies
            'paid_in' => null,
            'paid_out' => 5000, // £50.00 in pennies
        ]);

        $account->updateBalance();
        $account->refresh();

        // Balance should be the most recent transaction's balance (£1200)
        $this->assertEquals(120000, $account->balance); // £1200 in pence
    }

    public function test_casts_work_correctly(): void
    {
        $account = Account::factory()->create([
            'number' => '12345678',
            'balance_at_start' => '100000',
            'balance' => '150000',
        ]);

        $this->assertIsInt($account->number);
        $this->assertIsInt($account->balance_at_start);
        $this->assertIsInt($account->balance);
    }
}
