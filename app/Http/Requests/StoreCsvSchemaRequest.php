<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreCsvSchemaRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'transaction_data_start' => 'required|integer|min:1',
            'date_column' => 'required|integer|min:1',
            'balance_column' => 'required|integer|min:1',
            'amount_column' => 'nullable|integer|min:1',
            'paid_in_column' => 'nullable|integer|min:1',
            'paid_out_column' => 'nullable|integer|min:1',
            'description_column' => 'nullable|integer|min:1',
            'date_format' => 'nullable|string|max:50',
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
            if (
                empty($this->amount_column) &&
                empty($this->paid_in_column) &&
                empty($this->paid_out_column)
            ) {
                $validator->errors()->add('amount_configuration', 'Either amount column or paid_in/paid_out columns must be specified.');
            }

            /** @var User $user */
            $user = Auth::user();
            if ($user->csvSchemas()->where('name', $this->name)->exists()) {
                $validator->errors()->add('name', 'You already have a schema with this name.');
            }
        });
    }
}
