<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateAccountRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $account = $this->route('account');

        return $account->user_id === Auth::id();
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
            'number' => 'required|integer|unique:accounts,number,' . $this->account->id . ',id,user_id,' . Auth::id(),
            'sort_code' => 'nullable|string|max:20',
            'description' => 'nullable|string',
            'balance_at_start' => 'nullable|integer|min:0',
            'csv_schema_id' => 'nullable|exists:csv_schemas,id,user_id,' . Auth::id(),
        ];
    }
}
