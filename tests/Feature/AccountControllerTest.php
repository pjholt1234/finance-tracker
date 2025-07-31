<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Import;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);
    }

    public function test_authenticated_user_can_access_accounts_index(): void
    {
        $response = $this->actingAs($this->user)->get('/accounts');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('accounts/index'));
    }

    public function test_unauthenticated_user_cannot_access_accounts_index(): void
    {
        $response = $this->get('/accounts');

        $response->assertRedirect('/login');
    }

    public function test_accounts_index_shows_user_accounts(): void
    {
        $account1 = Account::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Account A',
        ]);
        $account2 = Account::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Account B',
        ]);
        $otherUserAccount = Account::factory()->create();

        $response = $this->actingAs($this->user)->get('/accounts');

        $response->assertStatus(200);
        $response->assertInertia(
            fn ($page) => $page->component('accounts/index')
                ->has('accounts', 2)
                ->where('accounts.0.id', $account1->id)
                ->where('accounts.1.id', $account2->id)
        );
    }

    public function test_store_creates_account_with_valid_data(): void
    {
        $response = $this->actingAs($this->user)->post(route('accounts.store'), [
            'name' => 'Test Account',
            'number' => 12345678,
            'sort_code' => '12-34-56',
            'description' => 'Test account description',
            'balance_at_start' => 100000, // £1000 in pennies
        ]);

        $response->assertRedirect(route('accounts.index'));

        $this->assertDatabaseHas('accounts', [
            'name' => 'Test Account',
            'number' => 12345678,
            'sort_code' => '12-34-56',
            'description' => 'Test account description',
            'balance_at_start' => 100000, // £1000 in pence
            'user_id' => $this->user->id,
        ]);
    }

    public function test_account_creation_validates_required_fields(): void
    {
        $response = $this->actingAs($this->user)->post('/accounts', []);

        $response->assertSessionHasErrors(['name', 'number']);
    }

    public function test_account_creation_prevents_duplicate_numbers(): void
    {
        Account::factory()->create([
            'user_id' => $this->user->id,
            'number' => 12345678,
        ]);

        $response = $this->actingAs($this->user)->post('/accounts', [
            'name' => 'Test Account',
            'number' => 12345678,
            'sort_code' => '12-34-56',
            'balance_at_start' => 100000,
        ]);

        $response->assertSessionHasErrors(['number']);
    }

    public function test_user_can_view_account(): void
    {
        $account = Account::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)->get("/accounts/{$account->id}");

        $response->assertStatus(200);
        $response->assertInertia(
            fn ($page) => $page->component('accounts/show')
                ->where('account.id', $account->id)
        );
    }

    public function test_user_cannot_view_other_users_account(): void
    {
        $otherUserAccount = Account::factory()->create();

        $response = $this->actingAs($this->user)->get("/accounts/{$otherUserAccount->id}");

        $response->assertStatus(403);
    }

    public function test_user_can_edit_account(): void
    {
        $account = Account::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)->get("/accounts/{$account->id}/edit");

        $response->assertStatus(200);
        $response->assertInertia(
            fn ($page) => $page->component('accounts/edit')
                ->where('account.id', $account->id)
        );
    }

    public function test_update_modifies_account_with_valid_data(): void
    {
        $account = Account::factory()->create([
            'user_id' => $this->user->id,
            'balance_at_start' => 100000,
        ]);

        $response = $this->actingAs($this->user)->put(route('accounts.update', $account), [
            'name' => 'Updated Account',
            'number' => 87654321,
            'sort_code' => '65-43-21',
            'description' => 'Updated description',
            'balance_at_start' => 200000, // £2000 in pennies
        ]);

        $response->assertRedirect(route('accounts.index'));

        $this->assertDatabaseHas('accounts', [
            'id' => $account->id,
            'name' => 'Updated Account',
            'number' => 87654321,
            'sort_code' => '65-43-21',
            'description' => 'Updated description',
            'balance_at_start' => 200000, // £2000 in pence
        ]);
    }

    public function test_user_cannot_update_other_users_account(): void
    {
        $otherUserAccount = Account::factory()->create();

        $response = $this->actingAs($this->user)->put("/accounts/{$otherUserAccount->id}", [
            'name' => 'Hacked Account',
            'number' => $otherUserAccount->number,
            'sort_code' => $otherUserAccount->sort_code,
            'balance_at_start' => 100000,
        ]);

        $response->assertStatus(403);
    }

    public function test_user_can_delete_empty_account(): void
    {
        $account = Account::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)->delete("/accounts/{$account->id}");

        $response->assertRedirect('/accounts');
        $response->assertSessionHas('success', 'Account deleted successfully.');

        $this->assertDatabaseMissing('accounts', [
            'id' => $account->id,
        ]);
    }

    public function test_user_cannot_delete_account_with_imports(): void
    {
        $account = Account::factory()->create(['user_id' => $this->user->id]);
        Import::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $account->id,
        ]);

        $response = $this->actingAs($this->user)->delete("/accounts/{$account->id}");

        $response->assertSessionHasErrors(['account']);
        $this->assertDatabaseHas('accounts', [
            'id' => $account->id,
        ]);
    }

    public function test_user_cannot_delete_account_with_transactions(): void
    {
        $account = Account::factory()->create(['user_id' => $this->user->id]);
        $import = Import::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $account->id,
        ]);
        Transaction::factory()->create([
            'user_id' => $this->user->id,
            'account_id' => $account->id,
            'import_id' => $import->id,
        ]);

        $response = $this->actingAs($this->user)->delete("/accounts/{$account->id}");

        $response->assertSessionHasErrors(['account']);
        $this->assertDatabaseHas('accounts', [
            'id' => $account->id,
        ]);
    }

    public function test_user_cannot_delete_other_users_account(): void
    {
        $otherUserAccount = Account::factory()->create();

        $response = $this->actingAs($this->user)->delete("/accounts/{$otherUserAccount->id}");

        $response->assertStatus(403);
    }

    public function test_user_can_recalculate_account_balance(): void
    {
        $account = Account::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->post(route('accounts.recalculate-balance', $account));

        $response->assertRedirect();
    }
}
