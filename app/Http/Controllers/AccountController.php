<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAccountRequest;
use App\Http\Requests\UpdateAccountRequest;
use App\Models\Account;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
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
        $accounts = Auth::user()->accounts()
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
        return Inertia::render('accounts/create');
    }

    /**
     * Store a newly created account in storage.
     */
    public function store(StoreAccountRequest $request)
    {
        $validated = $request->validated();

        $account = Account::create([
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
        // Verify ownership
        if ($account->user_id !== Auth::id()) {
            abort(403);
        }

        // Get the total transaction count before loading relationships
        $totalTransactionCount = $account->transactions()->count();

        // Load relationships with proper counts
        $account->load(['imports.csvSchema', 'transactions' => function ($query) {
            $query->latest()->limit(10);
        }]);

        // Update the account balance to ensure it's current
        $account->updateBalance();
        $account->refresh();

        // Explicitly format the account data to ensure relationships are included
        $accountData = $account->toArray();
        $accountData['total_transaction_count'] = $totalTransactionCount;

        // Ensure imports have their csvSchema relationship properly included
        if (isset($accountData['imports'])) {
            foreach ($accountData['imports'] as $index => $import) {
                if (isset($account->imports[$index]->csvSchema)) {
                    $accountData['imports'][$index]['csv_schema'] = $account->imports[$index]->csvSchema->toArray();
                }
            }
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
        // Verify ownership
        if ($account->user_id !== Auth::id()) {
            abort(403);
        }

        return Inertia::render('accounts/edit', [
            'account' => $account,
        ]);
    }

    /**
     * Update the specified account in storage.
     */
    public function update(UpdateAccountRequest $request, Account $account)
    {
        // Verify ownership
        if ($account->user_id !== Auth::id()) {
            abort(403);
        }

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
        // Verify ownership
        if ($account->user_id !== Auth::id()) {
            abort(403);
        }

        // Check if account has imports or transactions
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
        // Verify ownership
        if ($account->user_id !== Auth::id()) {
            abort(403);
        }

        // Update the account balance
        $account->updateBalance();

        return back()->with('success', 'Account balance recalculated successfully.');
    }
}
