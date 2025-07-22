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
        'type',
        'match_type',
        'value',
        'value_to',
        'day_of_month',
        'day_of_week',
        'logic_type',
    ];

    protected $casts = [
        'value_to' => 'float',
        'day_of_month' => 'integer',
        'day_of_week' => 'integer',
    ];

    /**
     * Get the tag that owns the criteria.
     */
    public function tag(): BelongsTo
    {
        return $this->belongsTo(Tag::class);
    }

    /**
     * Check if this criteria matches given transaction data.
     */
    public function matchesTransaction(?string $description = null, ?float $amount = null, ?string $date = null): bool
    {
        return match ($this->type) {
            'description' => $this->matchesDescription($description),
            'amount' => $this->matchesAmount($amount),
            'date' => $this->matchesDate($date),
            default => false,
        };
    }

    /**
     * Check if description matches based on match type.
     */
    private function matchesDescription(?string $description): bool
    {
        if (!$description || !$this->value) {
            return false;
        }

        return match ($this->match_type) {
            'exact' => $description === $this->value,
            'contains' => str_contains(strtolower($description), strtolower($this->value)),
            'starts_with' => str_starts_with(strtolower($description), strtolower($this->value)),
            'ends_with' => str_ends_with(strtolower($description), strtolower($this->value)),
            default => false,
        };
    }

    /**
     * Check if amount matches based on match type.
     */
    private function matchesAmount(?float $amount): bool
    {
        if ($amount === null || !$this->value) {
            return false;
        }

        $value = (float) $this->value;

        return match ($this->match_type) {
            'exact' => abs($amount - $value) < 0.01,
            'range' => $amount >= $value && $amount <= ($this->value_to ?? $value),
            'greater_than' => $amount > $value,
            'less_than' => $amount < $value,
            default => false,
        };
    }

    /**
     * Check if date matches based on match type.
     */
    private function matchesDate(?string $date): bool
    {
        if (!$date) {
            return false;
        }

        try {
            $dateObj = \Carbon\Carbon::parse($date);
        } catch (\Exception $e) {
            \Log::warning("Invalid date format in matchesDate: {$date}");
            return false;
        }

        return match ($this->match_type) {
            'exact' => $dateObj->format('Y-m-d') === $this->value,
            'day_of_month' => $dateObj->day === $this->day_of_month,
            'day_of_week' => $dateObj->dayOfWeek === $this->day_of_week,
            default => false,
        };
    }

    /**
     * Get the display name for the criteria type.
     */
    public function getTypeDisplayName(): string
    {
        return match ($this->type) {
            'description' => 'Description',
            'amount' => 'Amount',
            'date' => 'Date',
            default => 'Unknown',
        };
    }

    /**
     * Get the display name for the match type.
     */
    public function getMatchTypeDisplayName(): string
    {
        return match ($this->match_type) {
            'exact' => 'Exact Match',
            'contains' => 'Contains',
            'starts_with' => 'Starts With',
            'ends_with' => 'Ends With',
            'range' => 'Range',
            'greater_than' => 'Greater Than',
            'less_than' => 'Less Than',
            'day_of_month' => 'Day of Month',
            'day_of_week' => 'Day of Week',
            default => 'Unknown',
        };
    }

    /**
     * Get a human-readable description of this criteria.
     */
    public function getDescription(): string
    {
        $typeName = $this->getTypeDisplayName();
        $matchName = $this->getMatchTypeDisplayName();

        return match ($this->type) {
            'description' => "{$typeName} {$matchName}: \"{$this->value}\"",
            'amount' => match ($this->match_type) {
                'range' => "{$typeName} between \${$this->value} and \${$this->value_to}",
                'greater_than' => "{$typeName} greater than \${$this->value}",
                'less_than' => "{$typeName} less than \${$this->value}",
                default => "{$typeName} {$matchName}: \${$this->value}",
            },
            'date' => match ($this->match_type) {
                'day_of_month' => "{$typeName} on day {$this->day_of_month} of month",
                'day_of_week' => "{$typeName} on " . $this->getDayOfWeekName($this->day_of_week),
                default => "{$typeName} {$matchName}: {$this->value}",
            },
            default => "Unknown criteria",
        };
    }

    /**
     * Get day of week name.
     */
    private function getDayOfWeekName(int $day): string
    {
        return match ($day) {
            1 => 'Monday',
            2 => 'Tuesday',
            3 => 'Wednesday',
            4 => 'Thursday',
            5 => 'Friday',
            6 => 'Saturday',
            7 => 'Sunday',
            default => 'Unknown',
        };
    }
}
