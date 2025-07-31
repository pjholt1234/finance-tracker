<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class FinalizeTransactionImportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'transactions' => 'required|string',
            'schema_id' => 'required|exists:csv_schemas,id',
            'account_id' => 'required|exists:accounts,id',
            'filename' => 'required|string',
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     * @return void
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $transactions = $this->decodeTransactions();

            if (! $this->validateTransactionsArray($transactions, $validator)) {
                return;
            }

            if (! $this->validateTransactionStatuses($transactions, $validator)) {
                return;
            }

            if (! $this->validateTransactionTags($transactions, $validator)) {
                return;
            }

            if (! $this->validateUserTagOwnership($transactions, $validator)) {
                return;
            }
        });
    }

    /**
     * Decode the JSON transactions data.
     */
    private function decodeTransactions(): ?array
    {
        return json_decode($this->transactions, true);
    }

    /**
     * Validate that transactions is a valid array.
     */
    private function validateTransactionsArray(?array $transactions, $validator): bool
    {
        if (! $transactions || ! is_array($transactions)) {
            $validator->errors()->add('transactions', 'Invalid transactions data.');

            return false;
        }

        return true;
    }

    /**
     * Validate transaction statuses.
     */
    private function validateTransactionStatuses(array $transactions, $validator): bool
    {
        $validStatuses = ['approved', 'discarded', 'pending', 'duplicate'];

        foreach ($transactions as $index => $transaction) {
            if (! isset($transaction['status']) || ! in_array($transaction['status'], $validStatuses)) {
                $validator->errors()->add('transactions', "Invalid status for transaction {$index}.");

                return false;
            }
        }

        return true;
    }

    /**
     * Validate transaction tag structure.
     */
    private function validateTransactionTags(array $transactions, $validator): bool
    {
        foreach ($transactions as $index => $transaction) {
            if (! empty($transaction['tags'])) {
                foreach ($transaction['tags'] as $tag) {
                    if (! isset($tag['id']) || ! is_numeric($tag['id'])) {
                        $validator->errors()->add('transactions', "Invalid tag for transaction {$index}.");

                        return false;
                    }
                }
            }
        }

        return true;
    }

    /**
     * Validate that all tags belong to the user.
     */
    private function validateUserTagOwnership(array $transactions, $validator): bool
    {
        /** @var User $user */
        $user = Auth::user();
        $userTagIds = $user->tags()->pluck('id')->toArray();

        foreach ($transactions as $transaction) {
            if (! empty($transaction['tags'])) {
                foreach ($transaction['tags'] as $tag) {
                    if (! in_array($tag['id'], $userTagIds)) {
                        $validator->errors()->add('transactions', 'Invalid tag selected.');

                        return false;
                    }
                }
            }
        }

        return true;
    }
}
