<?php

namespace App\Http\Requests;

use App\Models\Tag;
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
            // Trim whitespace from name and description
            $this->merge([
                'name' => trim($this->name),
                'description' => isset($this->description) ? trim($this->description) : null,
            ]);

            // Convert empty string to null for description
            if ($this->description === '') {
                $this->merge(['description' => null]);
            }

            // Check for duplicate tag name for this user (excluding current tag)
            $tag = $this->route('tag');
            if (Auth::user()->tags()->where('name', $this->name)->where('id', '!=', $tag->id)->exists()) {
                $validator->errors()->add('name', 'You already have a tag with this name.');
            }
        });
    }
}
