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
        'date',
        'balance',
        'paid_in',
        'paid_out',
        'description',
        'reference',
        'import_id',
        'unique_hash',
    ];

    /**
     * Get the user that owns the transaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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
            ->withPivot('auto_applied')
            ->withTimestamps();
    }

    /**
     * Generate a unique hash for the transaction.
     * This is used to prevent duplicate imports.
     */
    public static function generateUniqueHash(int $userId, string $date, string $balance, ?string $paidIn = null, ?string $paidOut = null): string
    {
        $data = [
            'user_id' => $userId,
            'date' => $date,
            'balance' => $balance,
            'paid_in' => $paidIn ?? '',
            'paid_out' => $paidOut ?? '',
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
}
