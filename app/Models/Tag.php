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
        'archived',
    ];

    protected $casts = [
        'archived' => 'boolean',
    ];

    protected $visible = [
        'id',
        'name',
        'color',
        'description',
        'archived',
        'user_id',
        'created_at',
        'updated_at',
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
            ->withPivot('is_recommended', 'is_user_added')
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
     * Scope to filter out archived tags.
     */
    public function scopeActive($query)
    {
        return $query->where('archived', false);
    }

    /**
     * Scope to filter only archived tags.
     */
    public function scopeArchived($query)
    {
        return $query->where('archived', true);
    }

    /**
     * Check if this tag should be auto-applied to a transaction.
     */
    public function shouldAutoApply(Transaction $transaction): bool
    {
        if ($this->criterias->isEmpty()) {
            return false;
        }

        $matches = 0;
        $totalCriteria = $this->criterias->count();

        foreach ($this->criterias as $criteria) {
            if ($criteria->matchesTransaction(
                $transaction->description,
                $transaction->paid_out > 0 ? $transaction->paid_out / 100 : $transaction->paid_in / 100,
                $transaction->date->format('Y-m-d')
            )) {
                $matches++;
            }
        }

        // Use the logic type to determine if all criteria must match (AND) or any criteria (OR)
        $logicType = $this->criterias->first()?->logic_type ?? 'and';

        return match ($logicType) {
            'and' => $matches === $totalCriteria,
            'or' => $matches > 0,
            default => $matches === $totalCriteria,
        };
    }

    /**
     * Apply this tag to a transaction if criteria match.
     */
    public function autoApplyTo(Transaction $transaction): bool
    {
        // Check if tag is already applied
        if ($transaction->tags()->where('tag_id', $this->id)->exists()) {
            return false;
        }

        // Check if criteria match
        if ($this->shouldAutoApply($transaction)) {
            $transaction->tags()->attach($this->id, [
                'is_recommended' => true,
                'is_user_added' => false,
            ]);
            return true;
        }

        return false;
    }

    /**
     * Generate a random color for the tag.
     */
    public static function generateRandomColor(): string
    {
        $colors = [
            '#ef4444',
            '#f97316',
            '#f59e0b',
            '#eab308',
            '#84cc16',
            '#22c55e',
            '#10b981',
            '#14b8a6',
            '#06b6d4',
            '#0ea5e9',
            '#3b82f6',
            '#6366f1',
            '#8b5cf6',
            '#a855f7',
            '#d946ef',
            '#ec4899',
            '#f43f5e'
        ];

        return $colors[array_rand($colors)];
    }
}
