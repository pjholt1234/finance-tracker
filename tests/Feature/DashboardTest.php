<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        /** @var User $user */
        $user = User::factory()->create([
            'two_factor_confirmed_at' => now(), // Enable 2FA to avoid middleware redirect
        ]);

        $this->actingAs($user)->get('/dashboard')->assertOk();
    }

    public function test_dashboard_returns_correct_balance_data()
    {
        /** @var User $user */
        $user = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);

        // Create accounts
        $account1 = Account::factory()->create([
            'user_id' => $user->id,
            'name' => 'Main Account',
            'balance_at_start' => 10000, // $100.00
        ]);

        $account2 = Account::factory()->create([
            'user_id' => $user->id,
            'name' => 'Savings Account',
            'balance_at_start' => 50000, // $500.00
        ]);

        // Create transactions
        Transaction::factory()->create([
            'user_id' => $user->id,
            'account_id' => $account1->id,
            'date' => '2024-01-01',
            'balance' => 12000, // $120.00
            'paid_in' => 2000,  // $20.00
            'paid_out' => 0,
            'description' => 'Salary',
        ]);

        Transaction::factory()->create([
            'user_id' => $user->id,
            'account_id' => $account1->id,
            'date' => '2024-01-02',
            'balance' => 11500, // $115.00
            'paid_in' => 0,
            'paid_out' => 500,  // $5.00
            'description' => 'Coffee',
        ]);

        Transaction::factory()->create([
            'user_id' => $user->id,
            'account_id' => $account2->id,
            'date' => '2024-01-01',
            'balance' => 52000, // $520.00
            'paid_in' => 2000,  // $20.00
            'paid_out' => 0,
            'description' => 'Transfer',
        ]);

        $response = $this->actingAs($user)->getJson('/dashboard/api');

        $response->assertOk()
            ->assertJsonStructure([
                'accounts',
                'tags',
                'stats' => [
                    'income',
                    'outgoings',
                    'totalBalance',
                ],
                'tagBreakdown',
                'balanceOverTime',
            ]);

        $data = $response->json();

        // Check stats
        $this->assertEquals(40.0, $data['stats']['income']); // $20 + $20
        $this->assertEquals(5.0, $data['stats']['outgoings']); // $5
        $this->assertEquals(635.0, $data['stats']['totalBalance']); // $115 + $520

        // Check balance over time has data
        $this->assertNotEmpty($data['balanceOverTime']);
        $this->assertArrayHasKey('date', $data['balanceOverTime'][0]);
        $this->assertArrayHasKey('balance', $data['balanceOverTime'][0]);

        // Should have exactly 2 data points (one for each unique date with transactions)
        $this->assertCount(2, $data['balanceOverTime']);

        // Check that dates are in chronological order
        $this->assertEquals('2024-01-01', $data['balanceOverTime'][0]['date']);
        $this->assertEquals('2024-01-02', $data['balanceOverTime'][1]['date']);

        // Check balances for each date
        $this->assertEquals(600.0, $data['balanceOverTime'][0]['balance']); // Starting balance: $100 + $500
        $this->assertEquals(640.0, $data['balanceOverTime'][1]['balance']); // After transactions: $120 + $520
    }

    public function test_dashboard_handles_account_filters()
    {
        /** @var User $user */
        $user = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);

        $account1 = Account::factory()->create([
            'user_id' => $user->id,
            'name' => 'Main Account',
            'balance_at_start' => 10000,
        ]);

        $account2 = Account::factory()->create([
            'user_id' => $user->id,
            'name' => 'Savings Account',
            'balance_at_start' => 50000,
        ]);

        // Create transactions for both accounts
        Transaction::factory()->create([
            'user_id' => $user->id,
            'account_id' => $account1->id,
            'date' => '2024-01-01',
            'balance' => 12000,
            'paid_in' => 2000,
            'paid_out' => 0,
        ]);

        Transaction::factory()->create([
            'user_id' => $user->id,
            'account_id' => $account2->id,
            'date' => '2024-01-01',
            'balance' => 52000,
            'paid_in' => 2000,
            'paid_out' => 0,
        ]);

        // Filter by only account1
        $response = $this->actingAs($user)->getJson('/dashboard/api?account_ids='.$account1->id);

        $data = $response->json();

        // Should only include account1 data
        $this->assertEquals(20.0, $data['stats']['income']); // Only $20 from account1
        $this->assertEquals(120.0, $data['stats']['totalBalance']); // Only $120 from account1
    }

    public function test_dashboard_handles_date_filters()
    {
        /** @var User $user */
        $user = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);

        $account = Account::factory()->create([
            'user_id' => $user->id,
            'name' => 'Main Account',
            'balance_at_start' => 10000,
        ]);

        // Create transactions on different dates
        Transaction::factory()->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'date' => '2024-01-01',
            'balance' => 12000,
            'paid_in' => 2000,
            'paid_out' => 0,
        ]);

        Transaction::factory()->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'date' => '2024-01-15',
            'balance' => 11500,
            'paid_in' => 0,
            'paid_out' => 500,
        ]);

        // Filter by date range
        $response = $this->actingAs($user)->getJson('/dashboard/api?date_from=2024-01-10&date_to=2024-01-20');

        $data = $response->json();

        // Should only include transactions in the date range
        $this->assertEquals(0.0, $data['stats']['income']); // No income in range
        $this->assertEquals(5.0, $data['stats']['outgoings']); // Only $5 outgoings in range
        $this->assertEquals(115.0, $data['stats']['totalBalance']); // Latest balance in range

        // Should have 2 data points: starting balance and transaction date
        $this->assertCount(2, $data['balanceOverTime']);
        $this->assertEquals('2024-01-01', $data['balanceOverTime'][0]['date']); // Starting balance
        $this->assertEquals(100.0, $data['balanceOverTime'][0]['balance']); // Starting balance
        $this->assertEquals('2024-01-15', $data['balanceOverTime'][1]['date']); // Transaction date
        $this->assertEquals(120.0, $data['balanceOverTime'][1]['balance']); // After transaction
    }
}
