<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Tag;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    use AuthorizesRequests;

    /**
     * Show the dashboard.
     */
    public function index(): Response
    {
        return Inertia::render('dashboard');
    }

    /**
     * Get dashboard data.
     */
    public function dashboard(Request $request)
    {
        $this->authorize('viewAny', Transaction::class);

        $user = Auth::user();

        // Get filter parameters
        $accountIds = $request->input('account_ids') ? explode(',', $request->input('account_ids')) : [];
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $tagIds = $request->input('tag_ids') ? explode(',', $request->input('tag_ids')) : [];

        // Build query for transactions
        $query = Transaction::query()
            ->whereHas('account', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });

        // Apply filters
        if (! empty($accountIds)) {
            $query->whereIn('account_id', $accountIds);
        }

        if ($dateFrom) {
            $query->where('date', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->where('date', '<=', $dateTo);
        }

        if (! empty($tagIds)) {
            $query->whereHas('tags', function ($q) use ($tagIds) {
                $q->whereIn('tags.id', $tagIds);
            });
        }

        // Get transactions for the period
        $transactions = $query->with(['account', 'tags'])->get();

        // Calculate stats
        $income = $transactions->where('paid_in', '>', 0)->sum('paid_in') / 100;
        $outgoings = $transactions->where('paid_out', '>', 0)->sum('paid_out') / 100;

        // Calculate total balance (most recent balance from each account)
        $totalBalance = 0;
        $accounts = Account::where('user_id', $user->id)->get();

        foreach ($accounts as $account) {
            // Skip if account is filtered out
            if (! empty($accountIds) && ! in_array($account->id, $accountIds)) {
                continue;
            }

            $latestTransaction = Transaction::where('account_id', $account->id)
                ->orderBy('date', 'desc')
                ->orderBy('id', 'desc')
                ->first();

            if ($latestTransaction) {
                $totalBalance += $latestTransaction->balance / 100;
            } else {
                $totalBalance += $account->balance_at_start / 100;
            }
        }

        // Get tag breakdown
        $tagBreakdown = [];
        $tagTransactionCounts = [];

        if (! empty($tagIds)) {
            // When tags are filtered, only show breakdown for the selected tags
            $selectedTags = Tag::whereIn('id', $tagIds)->pluck('name', 'id');

            $tagStats = $transactions->flatMap(function ($transaction) use ($selectedTags) {
                return $transaction->tags->filter(function ($tag) use ($selectedTags) {
                    // Only include tags that were selected in the filter
                    return $selectedTags->has($tag->id);
                })->map(function ($tag) use ($transaction) {
                    $income = $transaction->paid_in > 0 ? $transaction->paid_in / 100 : 0;
                    $outgoings = $transaction->paid_out > 0 ? $transaction->paid_out / 100 : 0;

                    return [
                        'tag' => $tag->name,
                        'tag_id' => $tag->id,
                        'income' => $income,
                        'outgoings' => $outgoings,
                        'net' => $income - $outgoings,
                    ];
                });
            })->groupBy('tag')->map(function ($items, $tagName) {
                $totalIncome = $items->sum('income');
                $totalOutgoings = $items->sum('outgoings');

                return [
                    'tag' => $tagName,
                    'income' => $totalIncome,
                    'outgoings' => $totalOutgoings,
                    'net' => $totalIncome - $totalOutgoings,
                    'transaction_count' => $items->count(),
                ];
            })->values();
        } else {
            // When no tags are filtered, show all tags from transactions
            $tagStats = $transactions->flatMap(function ($transaction) {
                return $transaction->tags->map(function ($tag) use ($transaction) {
                    $income = $transaction->paid_in > 0 ? $transaction->paid_in / 100 : 0;
                    $outgoings = $transaction->paid_out > 0 ? $transaction->paid_out / 100 : 0;

                    return [
                        'tag' => $tag->name,
                        'tag_id' => $tag->id,
                        'income' => $income,
                        'outgoings' => $outgoings,
                        'net' => $income - $outgoings,
                    ];
                });
            })->groupBy('tag')->map(function ($items, $tagName) {
                $totalIncome = $items->sum('income');
                $totalOutgoings = $items->sum('outgoings');

                return [
                    'tag' => $tagName,
                    'income' => $totalIncome,
                    'outgoings' => $totalOutgoings,
                    'net' => $totalIncome - $totalOutgoings,
                    'transaction_count' => $items->count(),
                ];
            })->values();
        }

        // Get transaction count breakdown for pie chart
        $tagTransactionCounts = $tagStats->map(function ($tag) {
            return [
                'name' => $tag['tag'],
                'value' => $tag['transaction_count'],
            ];
        })->toArray();

        // Get balance over time (daily balance for the filtered period)
        $balanceOverTime = $this->calculateBalanceOverTime($user, $accountIds, $dateFrom, $dateTo);

        return response()->json([
            'accounts' => $accounts,
            'tags' => Tag::where('user_id', $user->id)->active()->get(),
            'stats' => [
                'income' => round($income, 2),
                'outgoings' => round($outgoings, 2),
                'totalBalance' => round($totalBalance, 2),
            ],
            'tagBreakdown' => $tagStats->toArray(),
            'tagTransactionCounts' => $tagTransactionCounts,
            'balanceOverTime' => $balanceOverTime,
        ]);
    }

    /**
     * Calculate balance over time for the specified period and accounts.
     */
    private function calculateBalanceOverTime($user, $accountIds, $dateFrom, $dateTo)
    {
        $endDate = $dateTo ? Carbon::parse($dateTo) : Carbon::now();
        $startDate = $dateFrom ? Carbon::parse($dateFrom) : $endDate->copy()->subDays(30);

        // Get all transactions for the accounts in the date range
        $query = Transaction::whereHas('account', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        });

        if (! empty($accountIds)) {
            $query->whereIn('account_id', $accountIds);
        }

        // Apply date range filter
        $query->where('date', '>=', $startDate->format('Y-m-d'))
            ->where('date', '<=', $endDate->format('Y-m-d'));

        $allTransactions = $query->orderBy('date')
            ->orderBy('id')
            ->get();

        // Group transactions by account and date
        $transactionsByAccount = $allTransactions->groupBy('account_id');

        // Get all unique dates where transactions occurred
        $transactionDates = $allTransactions->pluck('date')->unique()->sort();

        // If no transactions in range, return empty array
        if ($transactionDates->isEmpty()) {
            return [];
        }

        $balanceOverTime = [];

        // Calculate balance for each date where transactions occurred
        foreach ($transactionDates as $date) {
            $dateString = $date->format('Y-m-d');
            $dailyBalance = 0;

            // Calculate balance for each account on this date
            foreach ($transactionsByAccount as $accountId => $accountTransactions) {
                // Skip if account is filtered out
                if (! empty($accountIds) && ! in_array($accountId, $accountIds)) {
                    continue;
                }

                // Get the latest transaction for this account up to this date
                $latestTransaction = $accountTransactions
                    ->where('date', '<=', $dateString)
                    ->sortByDesc('date')
                    ->sortByDesc('id')
                    ->first();

                if ($latestTransaction) {
                    $dailyBalance += $latestTransaction->balance / 100;
                } else {
                    // If no transactions, use account starting balance
                    $account = Account::find($accountId);
                    if ($account) {
                        $dailyBalance += $account->balance_at_start / 100;
                    }
                }
            }

            $balanceOverTime[] = [
                'date' => $dateString,
                'balance' => round($dailyBalance, 2),
            ];
        }

        return $balanceOverTime;
    }
}
