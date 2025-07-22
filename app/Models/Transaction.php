<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'account_id',
        'date',
        'balance',
        'paid_in',
        'paid_out',
        'description',
        'reference',
        'import_id',
        'unique_hash',
    ];

    protected $casts = [
        'date' => 'date',
        'balance' => 'integer',
        'paid_in' => 'integer',
        'paid_out' => 'integer',
    ];

    /**
     * Get the user that owns the transaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the account that owns the transaction.
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the import that created this transaction.
     */
    public function import(): BelongsTo
    {
        return $this->belongsTo(Import::class);
    }

    /**
     * The tags that belong to the transaction.
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class)
            ->withPivot('is_recommended', 'is_user_added')
            ->withTimestamps();
    }

    /**
     * Convert currency string to pennies.
     */
    public static function currencyToPennies(?string $amount): ?int
    {
        if (empty($amount)) {
            return null;
        }

        $numericMatch = preg_match('/-?\d+\.?\d*/', $amount, $matches);

        if ($numericMatch && isset($matches[0])) {
            $numericValue = floatval($matches[0]);
            return (int) round($numericValue * 100);
        }

        return null;
    }

    /**
     * Convert pennies to formatted currency string.
     */
    public static function penniesToCurrency(?int $pennies): string
    {
        if ($pennies === null) {
            return '';
        }

        return number_format($pennies / 100, 2);
    }

    /**
     * Get the formatted balance.
     */
    public function getFormattedBalanceAttribute(): string
    {
        return self::penniesToCurrency($this->balance);
    }

    /**
     * Get the formatted paid in amount.
     */
    public function getFormattedPaidInAttribute(): string
    {
        return self::penniesToCurrency($this->paid_in);
    }

    /**
     * Get the formatted paid out amount.
     */
    public function getFormattedPaidOutAttribute(): string
    {
        return self::penniesToCurrency($this->paid_out);
    }

    /**
     * Get the formatted date in d/m/Y format.
     */
    public function getFormattedDateAttribute(): string
    {
        return $this->date ? $this->date->format('d/m/Y') : '';
    }

    /**
     * Generate a unique hash for the transaction.
     * This is used to prevent duplicate imports.
     */
    public static function generateUniqueHash(int $userId, string $date, ?int $balance, ?int $paidIn = null, ?int $paidOut = null): string
    {
        $data = [
            'user_id' => $userId,
            'date' => $date,
            'balance' => $balance ?? 0,
            'paid_in' => $paidIn ?? 0,
            'paid_out' => $paidOut ?? 0,
        ];

        return hash('sha256', json_encode($data));
    }

    /**
     * Check if a transaction with the same hash already exists.
     */
    public static function existsByHash(string $hash): bool
    {
        return self::where('unique_hash', $hash)->exists();
    }

    /**
     * Scope to filter transactions by user.
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter transactions by import ID.
     */
    public function scopeForImport($query, int $importId)
    {
        return $query->where('import_id', $importId);
    }

    /**
     * Scope to filter transactions by account ID.
     */
    public function scopeForAccount($query, int $accountId)
    {
        return $query->where('account_id', $accountId);
    }
}
