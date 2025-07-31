<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAccountRequest;
use App\Http\Requests\UpdateAccountRequest;
use App\Models\Account;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of the accounts.
     */
    public function index(): Response
    {
        /** @var User $user */
        $user = Auth::user();
        $accounts = $user->accounts()
            ->orderBy('name')
            ->get();

        return Inertia::render('accounts/index', [
            'accounts' => $accounts,
        ]);
    }

    /**
     * Show the form for creating a new account.
     */
    public function create(): Response
    {
        $this->authorize('create', Account::class);

        return Inertia::render('accounts/create');
    }

    /**
     * Store a newly created account in storage.
     */
    public function store(StoreAccountRequest $request)
    {
        $this->authorize('create', Account::class);
        $validated = $request->validated();

        Account::create([
            'user_id' => Auth::id(),
            'name' => $validated['name'],
            'number' => $validated['number'],
            'sort_code' => $validated['sort_code'],
            'description' => $validated['description'],
            'balance_at_start' => $validated['balance_at_start'] ?? 0,
            'balance' => $validated['balance_at_start'] ?? 0,
        ]);

        return redirect()->route('accounts.index')
            ->with('success', 'Account created successfully.');
    }

    /**
     * Display the specified account.
     */
    public function show(Account $account): Response
    {
        $this->authorize('view', $account);

        $account->load(['imports.csvSchema', 'transactions' => function ($query) {
            $query->latest()->limit(10);
        }]);

        $account->updateBalance();
        $account->refresh();

        $accountData = $account->toArray();
        $accountData['total_transaction_count'] = $account
            ->transactions()
            ->count();

        if (! isset($accountData['imports'])) {
            return Inertia::render('accounts/show', [
                'account' => $accountData,
            ]);
        }

        foreach ($accountData['imports'] as $index => $import) {
            if (! isset($account->imports[$index]->csvSchema)) {
                continue;
            }

            $accountData['imports'][$index]['csv_schema'] = $account->imports[$index]->csvSchema->toArray();
        }

        return Inertia::render('accounts/show', [
            'account' => $accountData,
        ]);
    }

    /**
     * Show the form for editing the specified account.
     */
    public function edit(Account $account): Response
    {
        $this->authorize('update', $account);

        return Inertia::render('accounts/edit', [
            'account' => $account,
        ]);
    }

    /**
     * Update the specified account in storage.
     */
    public function update(UpdateAccountRequest $request, Account $account)
    {
        $this->authorize('update', $account);

        $validated = $request->validated();

        $account->update([
            'name' => $validated['name'],
            'number' => $validated['number'],
            'sort_code' => $validated['sort_code'],
            'description' => $validated['description'],
            'balance_at_start' => $validated['balance_at_start'] ?? 0,
        ]);

        return redirect()->route('accounts.index')
            ->with('success', 'Account updated successfully.');
    }

    /**
     * Remove the specified account from storage.
     */
    public function destroy(Account $account)
    {
        $this->authorize('delete', $account);

        if ($account->imports()->exists() || $account->transactions()->exists()) {
            return back()->withErrors([
                'account' => 'Cannot delete account that has imports or transactions.',
            ]);
        }

        $account->delete();

        return redirect()->route('accounts.index')
            ->with('success', 'Account deleted successfully.');
    }

    /**
     * Recalculate the account balance.
     */
    public function recalculateBalance(Account $account)
    {
        $this->authorize('recalculateBalance', $account);

        $account->updateBalance();

        return back()->with('success', 'Account balance recalculated successfully.');
    }
}
