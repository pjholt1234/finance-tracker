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
            'criterias.*.day_of_week.integer' => 'Day of week must be a number.',
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
            $this->merge([
                'name' => trim($this->name),
                'description' => isset($this->description) ? trim($this->description) : null,
            ]);

            if ($this->description === '') {
                $this->merge(['description' => null]);
            }

            // Validate criteria based on match type
            if ($this->has('criterias') && is_array($this->criterias)) {
                foreach ($this->criterias as $index => $criteria) {
                    // Validate range criteria
                    if (isset($criteria['match_type']) && $criteria['match_type'] === 'range') {
                        if (empty($criteria['value_to'])) {
                            $validator->errors()->add("criterias.{$index}.value_to", 'Range end value is required for range criteria.');
                        } else {
                            // Validate that range values are numeric
                            if (!is_numeric($criteria['value']) || !is_numeric($criteria['value_to'])) {
                                $validator->errors()->add("criterias.{$index}.value", 'Range values must be numbers.');
                            } elseif (floatval($criteria['value']) >= floatval($criteria['value_to'])) {
                                $validator->errors()->add("criterias.{$index}.value_to", 'Range end value must be greater than start value.');
                            }
                        }
                    }

                    // Validate description criteria
                    if (isset($criteria['type']) && $criteria['type'] === 'description') {
                        if (empty($criteria['value'])) {
                            $validator->errors()->add("criterias.{$index}.value", 'Description value is required.');
                        }
                    }

                    // Validate amount criteria
                    if (isset($criteria['type']) && $criteria['type'] === 'amount') {
                        if (empty($criteria['value'])) {
                            $validator->errors()->add("criterias.{$index}.value", 'Amount value is required.');
                        } elseif (!is_numeric($criteria['value'])) {
                            $validator->errors()->add("criterias.{$index}.value", 'Amount value must be a number.');
                        }
                        if (isset($criteria['match_type']) && in_array($criteria['match_type'], ['greater_than', 'less_than'])) {
                            if (!is_numeric($criteria['value'])) {
                                $validator->errors()->add("criterias.{$index}.value", 'Amount value must be a number.');
                            }
                        }
                    }

                    // Validate date criteria
                    if (isset($criteria['type']) && $criteria['type'] === 'date') {
                        if (isset($criteria['match_type'])) {
                            if ($criteria['match_type'] === 'exact') {
                                if (empty($criteria['value'])) {
                                    $validator->errors()->add("criterias.{$index}.value", 'Date value is required for exact date criteria.');
                                } elseif (!strtotime($criteria['value'])) {
                                    $validator->errors()->add("criterias.{$index}.value", 'Please enter a valid date (YYYY-MM-DD format).');
                                }
                            } elseif ($criteria['match_type'] === 'day_of_month') {
                                if (empty($criteria['day_of_month'])) {
                                    $validator->errors()->add("criterias.{$index}.day_of_month", 'Day of month is required for day of month criteria.');
                                } else {
                                    $day = intval($criteria['day_of_month']);
                                    if ($day < 1 || $day > 31) {
                                        $validator->errors()->add("criterias.{$index}.day_of_month", 'Day of month must be between 1 and 31.');
                                    }
                                }
                            } elseif ($criteria['match_type'] === 'day_of_week') {
                                if (empty($criteria['day_of_week'])) {
                                    $validator->errors()->add("criterias.{$index}.day_of_week", 'Day of week is required for day of week criteria.');
                                } else {
                                    $day = intval($criteria['day_of_week']);
                                    if ($day < 1 || $day > 7) {
                                        $validator->errors()->add("criterias.{$index}.day_of_week", 'Day of week must be between 1 and 7.');
                                    }
                                }
                            }
                        }
                    }
                }
            }

            /** @var User $user */
            $user = Auth::user();
            if ($user->tags()->where('name', $this->name)->exists()) {
                $validator->errors()->add('name', 'You already have a tag with this name.');
            }
        });
    }
}
