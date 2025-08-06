<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'csv_schema_id',
    ];

    protected $casts = [
        'number' => 'integer',
        'balance_at_start' => 'integer',
        'balance' => 'integer',
    ];

    /**
     * Get the CSV schema associated with this account.
     */
    public function csvSchema(): BelongsTo
    {
        return $this->belongsTo(CsvSchema::class);
    }

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
        $latestTransaction = $this->transactions()
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        if ($latestTransaction && $latestTransaction->balance !== null) {
            $this->update([
                'balance' => $latestTransaction->balance,
            ]);
        } else {
            $this->update([
                'balance' => $this->balance_at_start,
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
