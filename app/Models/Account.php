<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Account extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'number',
        'sort_code',
        'description',
        'balance_at_start',
        'balance',
    ];

    protected $casts = [
        'number' => 'integer',
        'balance_at_start' => 'integer',
        'balance' => 'integer',
    ];

    /**
     * Get the user that owns the account.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the imports for this account.
     */
    public function imports(): HasMany
    {
        return $this->hasMany(Import::class);
    }

    /**
     * Get the transactions for this account.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Scope to filter accounts by user.
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Update the account balance to the most recent transaction's balance.
     */
    public function updateBalance(): void
    {
        // Get the most recent transaction for this account
        $latestTransaction = $this->transactions()
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        if ($latestTransaction && $latestTransaction->balance !== null) {
            // Transaction balance is already in pennies
            $this->update([
                'balance' => $latestTransaction->balance
            ]);
        } else {
            // If no transactions exist, use the starting balance
            $this->update([
                'balance' => $this->balance_at_start
            ]);
        }
    }

    /**
     * Get the formatted balance.
     */
    public function getFormattedBalanceAttribute(): string
    {
        return number_format($this->balance / 100, 2);
    }

    /**
     * Get the formatted balance at start.
     */
    public function getFormattedBalanceAtStartAttribute(): string
    {
        return number_format($this->balance_at_start / 100, 2);
    }
}
