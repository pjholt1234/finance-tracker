<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tag extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'color',
        'description',
    ];

    /**
     * Get the user that owns the tag.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The transactions that belong to the tag.
     */
    public function transactions(): BelongsToMany
    {
        return $this->belongsToMany(Transaction::class)
            ->withPivot('auto_applied')
            ->withTimestamps();
    }

    /**
     * Get the tag criteria for this tag.
     */
    public function criterias(): HasMany
    {
        return $this->hasMany(TagCriteria::class);
    }

    /**
     * Scope to filter tags by user.
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Check if this tag should be auto-applied to a transaction.
     * Note: This method works with encrypted data, so it may have limitations.
     */
    public function shouldAutoApply(Transaction $transaction): bool
    {
        if ($this->criterias->isEmpty()) {
            return false;
        }

        foreach ($this->criterias as $criteria) {
            if ($criteria->matches($transaction)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Apply this tag to a transaction if criteria match.
     */
    public function autoApplyTo(Transaction $transaction): bool
    {
        if (!$this->shouldAutoApply($transaction)) {
            return false;
        }

        // Check if tag is already applied
        if ($transaction->tags()->where('tag_id', $this->id)->exists()) {
            return false;
        }

        // Apply the tag
        $transaction->tags()->attach($this->id, [
            'auto_applied' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return true;
    }
}
