<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class StoreTagRequest extends FormRequest
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
            'color' => 'nullable|string|max:7', // Hex color
            'description' => 'nullable|string|max:500',
            'expect_json' => 'nullable|boolean',
            'criterias' => 'nullable|array',
            'criterias.*.type' => 'required|in:description,amount,date',
            'criterias.*.match_type' => 'required|string',
            'criterias.*.value' => 'required|string',
            'criterias.*.value_to' => 'nullable',
            'criterias.*.day_of_month' => 'nullable|integer|min:1|max:31',
            'criterias.*.day_of_week' => 'nullable|integer|min:1|max:7',
            'criterias.*.logic_type' => 'nullable|in:and,or',
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
            $this->merge([
                'name' => trim($this->name),
                'description' => isset($this->description) ? trim($this->description) : null,
            ]);

            if ($this->description === '') {
                $this->merge(['description' => null]);
            }

            /** @var User $user */
            $user = Auth::user();
            if ($user->tags()->where('name', $this->name)->exists()) {
                $validator->errors()->add('name', 'You already have a tag with this name.');
            }
        });
    }
}
