<?php

namespace App\Observers;

use App\Models\Transaction;

class TransactionObserver
{
    /**
     * Handle the Transaction "creating" event.
     */
    public function creating(Transaction $transaction): void
    {
        if (empty($transaction->unique_hash)) {
            $transaction->unique_hash = Transaction::generateUniqueHash(
                $transaction->user_id,
                $transaction->date,
                $transaction->balance,
                $transaction->paid_in,
                $transaction->paid_out
            );
        }
    }
} 