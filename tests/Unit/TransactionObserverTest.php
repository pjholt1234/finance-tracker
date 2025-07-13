<?php

namespace Tests\Unit;

use App\Models\Account;
use App\Models\Import;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionObserverTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Account $account;
    protected Import $import;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->account = Account::factory()->create([
            'user_id' => $this->user->id,
            'balance_at_start' => 100000, // £1000
            'balance' => 100000,
        ]);
        $this->import = Import::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
        ]);
    }

    public function test_account_balance_updates_when_transaction_created(): void
    {
        Transaction::create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
            'import_id' => $this->import->id,
            'date' => '2023-01-01',
            'balance' => 125000, // £1250.00 in pennies
            'paid_in' => 25000, // £250.00 in pennies
            'paid_out' => null,
            'description' => 'Test transaction',
        ]);

        $this->account->refresh();

        // Balance should be the transaction's balance value (£1250)
        $this->assertEquals(125000, $this->account->balance);
    }

    public function test_account_balance_updates_when_transaction_updated(): void
    {
        $transaction = Transaction::create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
            'import_id' => $this->import->id,
            'date' => '2023-01-01',
            'balance' => 110000, // £1100.00 in pennies
            'paid_in' => 10000, // £100.00 in pennies
            'paid_out' => null,
            'description' => 'Test transaction',
        ]);

        $this->account->refresh();

        // Initial balance should be £1100 (from transaction balance field)
        $this->assertEquals(110000, $this->account->balance);

        // Update the transaction
        $transaction->update([
            'balance' => 120000, // £1200.00 in pennies
        ]);

        $this->account->refresh();

        // Balance should now be £1200 (from updated transaction balance field)
        $this->assertEquals(120000, $this->account->balance);
    }

    public function test_account_balance_updates_when_transaction_deleted(): void
    {
        $transaction = Transaction::create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
            'import_id' => $this->import->id,
            'date' => '2023-01-01',
            'balance' => 115000, // £1150.00 in pennies
            'paid_in' => 15000, // £150.00 in pennies
            'paid_out' => null,
            'description' => 'Test transaction',
        ]);

        $this->account->refresh();

        // Initial balance should be £1150 (from transaction balance field)
        $this->assertEquals(115000, $this->account->balance);

        $transaction->delete();

        $this->account->refresh();

        // Balance should be back to starting balance £1000 (no transactions left)
        $this->assertEquals(100000, $this->account->balance);
    }

    public function test_account_balance_updates_with_paid_out_transaction(): void
    {
        Transaction::create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
            'import_id' => $this->import->id,
            'date' => '2023-01-01',
            'balance' => 92500, // £925.00 in pennies
            'paid_in' => null,
            'paid_out' => 7500, // £75.00 in pennies
            'description' => 'Test transaction',
        ]);

        $this->account->refresh();

        // Balance should be the transaction's balance value (£925)
        $this->assertEquals(92500, $this->account->balance);
    }

    public function test_account_balance_uses_most_recent_transaction(): void
    {
        // Create first transaction
        Transaction::create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
            'import_id' => $this->import->id,
            'date' => '2023-01-01',
            'balance' => 120000, // £1200.00 in pennies
            'paid_in' => 20000, // £200.00 in pennies
            'paid_out' => null,
            'description' => 'First transaction',
        ]);

        // Create second transaction (more recent)
        Transaction::create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
            'import_id' => $this->import->id,
            'date' => '2023-01-02',
            'balance' => 110000, // £1100.00 in pennies
            'paid_in' => null,
            'paid_out' => 10000, // £100.00 in pennies
            'description' => 'Second transaction',
        ]);

        $this->account->refresh();

        // Balance should be the most recent transaction's balance value (£1100)
        $this->assertEquals(110000, $this->account->balance);
    }

    public function test_account_balance_ignores_null_balance(): void
    {
        Transaction::create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
            'import_id' => $this->import->id,
            'date' => '2023-01-01',
            'balance' => null, // No balance provided
            'paid_in' => 10000, // £100.00 in pennies
            'paid_out' => null,
            'description' => 'Test transaction',
        ]);

        $this->account->refresh();

        // Balance should remain at starting balance since transaction has no balance
        $this->assertEquals(100000, $this->account->balance);
    }
}
