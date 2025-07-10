<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TagCriteria extends Model
{
    use HasFactory;

    protected $fillable = [
        'tag_id',
        'description_match',
        'balance_match',
        'date_match',
        'match_type',
    ];

    protected $casts = [
        'balance_match' => 'float',
        'date_match' => 'date',
    ];

    /**
     * Get the tag that owns the criteria.
     */
    public function tag(): BelongsTo
    {
        return $this->belongsTo(Tag::class);
    }

    /**
     * Check if this criteria matches a transaction.
     * Note: This is complex with encrypted data, so this is a simplified implementation.
     * In a real-world scenario, you might need to decrypt data for matching or use 
     * different approaches like searchable encryption.
     */
    public function matches(Transaction $transaction): bool
    {
        // For encrypted data, exact matching is very difficult
        // This is a placeholder implementation that would need to be adapted
        // based on your encryption strategy
        
        // Since data is encrypted in frontend, we can't easily match here
        // You might need to:
        // 1. Pass decrypted data for matching
        // 2. Use searchable encryption
        // 3. Store hashes of common search terms
        // 4. Apply criteria during import when data is available
        
        // For now, returning false as a placeholder
        // This would be implemented based on your specific encryption approach
        return false;
    }

    /**
     * Check if this criteria matches given plain text values.
     * This method can be used during import when data is not yet encrypted.
     */
    public function matchesPlainData(?string $description = null, ?float $balance = null, ?string $date = null): bool
    {
        $matches = 0;
        $totalCriteria = 0;

        // Check description match
        if (!empty($this->description_match)) {
            $totalCriteria++;
            if ($description !== null && $this->matchesDescription($description)) {
                $matches++;
            }
        }

        // Check balance match
        if ($this->balance_match !== null) {
            $totalCriteria++;
            if ($balance !== null && abs($balance - (float)$this->balance_match) < 0.01) {
                $matches++;
            }
        }

        // Check date match
        if ($this->date_match !== null) {
            $totalCriteria++;
            if ($date !== null && $this->date_match->format('Y-m-d') === $date) {
                $matches++;
            }
        }

        // All criteria must match
        return $totalCriteria > 0 && $matches === $totalCriteria;
    }

    /**
     * Check if description matches based on match type.
     */
    private function matchesDescription(string $description): bool
    {
        return match ($this->match_type) {
            'exact' => $description === $this->description_match, // Case sensitive
            'contains' => str_contains(strtolower($description), strtolower($this->description_match)),
            'starts_with' => str_starts_with(strtolower($description), strtolower($this->description_match)),
            'ends_with' => str_ends_with(strtolower($description), strtolower($this->description_match)),
            default => false,
        };
    }
}
