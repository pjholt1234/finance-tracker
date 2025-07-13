<?php

namespace App\Observers;

use App\Models\Transaction;

class TransactionObserver
{
    /**
     * Handle the Transaction "created" event.
     */
    public function created(Transaction $transaction): void
    {
        $this->updateAccountBalance($transaction);
    }

    /**
     * Handle the Transaction "updated" event.
     */
    public function updated(Transaction $transaction): void
    {
        $this->updateAccountBalance($transaction);
    }

    /**
     * Handle the Transaction "deleted" event.
     */
    public function deleted(Transaction $transaction): void
    {
        $this->updateAccountBalance($transaction);
    }

    /**
     * Update the account balance when a transaction is modified.
     */
    private function updateAccountBalance(Transaction $transaction): void
    {
        if ($transaction->account_id) {
            $account = $transaction->account;
            if ($account) {
                $account->updateBalance();
            }
        }
    }
}
