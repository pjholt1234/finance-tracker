<?php

namespace App\Http\Requests;

use App\Models\Tag;
use App\Services\TagValidationService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateTagRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('tag'));
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
            'criterias' => 'nullable|array',
            'criterias.*.type' => 'required|in:description,amount,date',
            'criterias.*.match_type' => 'required|string',
            'criterias.*.value' => 'nullable|string|max:255',
            'criterias.*.value_to' => 'nullable|string|max:255',
            'criterias.*.day_of_month' => 'nullable|integer|min:1|max:31',
            'criterias.*.day_of_week' => 'nullable|integer|min:1|max:7',
            'criterias.*.logic_type' => 'nullable|in:and,or',
        ];
    }

    /**
     * Get custom validation messages for the request.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'criterias.*.type.required' => 'Criteria type is required.',
            'criterias.*.type.in' => 'Criteria type must be description, amount, or date.',
            'criterias.*.match_type.required' => 'Match type is required.',
            'criterias.*.value.required' => 'Criteria value is required.',
            'criterias.*.value.max' => 'Criteria value cannot exceed 255 characters.',
            'criterias.*.value_to.max' => 'Range end value cannot exceed 255 characters.',
            'criterias.*.day_of_month.integer' => 'Day of month must be a number.',
            'criterias.*.day_of_month.min' => 'Day of month must be between 1 and 31.',
            'criterias.*.day_of_month.max' => 'Day of month must be between 1 and 31.',
            'criterias.*.day_of_week.integer' => 'Day of week must be between 1 and 7.',
            'criterias.*.day_of_week.min' => 'Day of week must be between 1 and 7.',
            'criterias.*.day_of_week.max' => 'Day of week must be between 1 and 7.',
            'criterias.*.logic_type.in' => 'Logic type must be "and" or "or".',
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
            $validationService = new TagValidationService();

            // Prepare and merge cleaned data
            $cleanedData = $validationService->prepareTagData($this->all());
            $this->merge($cleanedData);

            // Validate criteria if present
            if ($this->has('criterias') && is_array($this->criterias)) {
                $validationService->validateCriterias($validator, $this->criterias);
            }

            // Validate tag name uniqueness for update only if name is present
            if (isset($this->name) && !empty($this->name)) {
                $tag = $this->route('tag');
                $validationService->validateTagNameUniquenessForUpdate($validator, $this->name, $tag->id);
            }
        });
    }
}
