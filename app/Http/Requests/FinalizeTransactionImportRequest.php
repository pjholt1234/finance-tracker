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
            'temp_path' => 'required|string',
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
            // Decode the JSON transactions data
            $transactions = json_decode($this->transactions, true);

            if (!$transactions || !is_array($transactions)) {
                $validator->errors()->add('transactions', 'Invalid transactions data.');
                return;
            }

            // Validate each transaction
            foreach ($transactions as $index => $transaction) {
                if (!isset($transaction['status']) || !in_array($transaction['status'], ['approved', 'discarded', 'pending', 'duplicate'])) {
                    $validator->errors()->add('transactions', "Invalid status for transaction {$index}.");
                    return;
                }

                if (!empty($transaction['tags'])) {
                    foreach ($transaction['tags'] as $tag) {
                        if (!isset($tag['id']) || !is_numeric($tag['id'])) {
                            $validator->errors()->add('transactions', "Invalid tag for transaction {$index}.");
                            return;
                        }
                    }
                }
            }

            // Verify all tags belong to the user
            $userTagIds = Auth::user()->tags()->pluck('id')->toArray();
            foreach ($transactions as $transaction) {
                if (!empty($transaction['tags'])) {
                    foreach ($transaction['tags'] as $tag) {
                        if (!in_array($tag['id'], $userTagIds)) {
                            $validator->errors()->add('transactions', 'Invalid tag selected.');
                            return;
                        }
                    }
                }
            }
        });
    }
}
