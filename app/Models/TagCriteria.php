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
     * Check if this criteria matches given plain text values.
     * This method can be used during import when data is not yet encrypted.
     */
    public function matchesPlainData(?string $description = null, ?float $balance = null, ?string $date = null): bool
    {
        $matches = 0;
        $totalCriteria = 0;

        if (!empty($this->description_match)) {
            $totalCriteria++;
            if ($description !== null && $this->matchesDescription($description)) {
                $matches++;
            }
        }

        if ($this->balance_match !== null) {
            $totalCriteria++;
            if ($balance !== null && abs($balance - (float)$this->balance_match) < 0.01) {
                $matches++;
            }
        }

        if ($this->date_match !== null) {
            $totalCriteria++;
            if ($date !== null && $this->date_match->format('Y-m-d') === $date) {
                $matches++;
            }
        }

        return $totalCriteria > 0 && $matches === $totalCriteria;
    }

    /**
     * Check if description matches based on match type.
     */
    private function matchesDescription(string $description): bool
    {
        return match ($this->match_type) {
            'exact' => $description === $this->description_match,
            'contains' => str_contains(strtolower($description), strtolower($this->description_match)),
            'starts_with' => str_starts_with(strtolower($description), strtolower($this->description_match)),
            'ends_with' => str_ends_with(strtolower($description), strtolower($this->description_match)),
            default => false,
        };
    }
}
