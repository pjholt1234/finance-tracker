<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Validation\ValidationException;

class CsvSchema extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'transaction_data_start',
        'date_column',
        'balance_column',
        'amount_column',
        'paid_in_column',
        'paid_out_column',
        'description_column',
        'date_format',
    ];

    protected $casts = [
        'transaction_data_start' => 'integer',
    ];

    /**
     * Get the user that owns the CSV schema.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Validate the schema configuration.
     */
    public function validateSchema(): void
    {
        // Either amount column OR both paid_in/paid_out must be defined
        $hasAmount = !empty($this->amount_column);
        $hasPaidInOut = !empty($this->paid_in_column) || !empty($this->paid_out_column);

        if (!$hasAmount && !$hasPaidInOut) {
            throw ValidationException::withMessages([
                'amount_configuration' => 'Either amount column or paid_in/paid_out columns must be defined.'
            ]);
        }

        // Date and balance are required
        if (empty($this->date_column)) {
            throw ValidationException::withMessages([
                'date_column' => 'Date column is required.'
            ]);
        }

        if (empty($this->balance_column)) {
            throw ValidationException::withMessages([
                'balance_column' => 'Balance column is required.'
            ]);
        }

        // Transaction data start must be positive
        if ($this->transaction_data_start < 1) {
            throw ValidationException::withMessages([
                'transaction_data_start' => 'Transaction data start row must be 1 or greater.'
            ]);
        }

        // Column numbers must be positive integers or valid letters
        $columns = ['date_column', 'balance_column', 'amount_column', 'paid_in_column', 'paid_out_column', 'description_column'];
        foreach ($columns as $column) {
            if (!empty($this->$column)) {
                $value = $this->$column;
                // Check if it's a valid numeric column (1 or greater)
                if (is_numeric($value) && $value < 1) {
                    throw ValidationException::withMessages([
                        $column => 'Column number must be 1 or greater.'
                    ]);
                }
                // Check if it's a valid letter column (A-Z)
                if (is_string($value) && !preg_match('/^[A-Z]$/i', $value)) {
                    throw ValidationException::withMessages([
                        $column => 'Column must be a valid letter (A-Z) or number (1 or greater).'
                    ]);
                }
            }
        }
    }

    /**
     * Check if this schema uses a single amount column.
     */
    public function usesSingleAmountColumn(): bool
    {
        return !empty($this->amount_column);
    }

    /**
     * Check if this schema uses separate paid in/out columns.
     */
    public function usesSeparateAmountColumns(): bool
    {
        return !empty($this->paid_in_column) || !empty($this->paid_out_column);
    }

    /**
     * Get the column mapping as an array.
     */
    public function getColumnMapping(): array
    {
        $mapping = [
            'date' => $this->date_column,
            'balance' => $this->balance_column,
        ];

        if ($this->usesSingleAmountColumn()) {
            $mapping['amount'] = $this->amount_column;
        } else {
            if ($this->paid_in_column) {
                $mapping['paid_in'] = $this->paid_in_column;
            }
            if ($this->paid_out_column) {
                $mapping['paid_out'] = $this->paid_out_column;
            }
        }

        if ($this->description_column) {
            $mapping['description'] = $this->description_column;
        }

        return $mapping;
    }
}
