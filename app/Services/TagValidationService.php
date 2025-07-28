<?php

namespace App\Services;

use App\Models\Tag;
use App\Models\User;
use Illuminate\Validation\Validator;
use Illuminate\Support\Facades\Auth;

class TagValidationService
{
    /**
     * Validate tag criteria based on their type and match type.
     *
     * @param Validator $validator
     * @param array $criterias
     * @return void
     */
    public function validateCriterias(Validator $validator, array $criterias): void
    {
        foreach ($criterias as $index => $criteria) {
            $this->validateRangeCriteria($validator, $criteria, $index);
            $this->validateDescriptionCriteria($validator, $criteria, $index);
            $this->validateAmountCriteria($validator, $criteria, $index);
            $this->validateDateCriteria($validator, $criteria, $index);
        }
    }

    /**
     * Validate range criteria.
     *
     * @param Validator $validator
     * @param array $criteria
     * @param int $index
     * @return void
     */
    private function validateRangeCriteria(Validator $validator, array $criteria, int $index): void
    {
        if (!isset($criteria['match_type']) || $criteria['match_type'] !== 'range') {
            return;
        }

        if (empty($criteria['value_to'])) {
            $validator->errors()->add("criterias.{$index}.value_to", 'Range end value is required for range criteria.');
            return;
        }

        if (!is_numeric($criteria['value']) || !is_numeric($criteria['value_to'])) {
            $validator->errors()->add("criterias.{$index}.value", 'Range values must be numbers.');
            return;
        }

        if (floatval($criteria['value']) >= floatval($criteria['value_to'])) {
            $validator->errors()->add("criterias.{$index}.value_to", 'Range end value must be greater than start value.');
        }
    }

    /**
     * Validate description criteria.
     *
     * @param Validator $validator
     * @param array $criteria
     * @param int $index
     * @return void
     */
    private function validateDescriptionCriteria(Validator $validator, array $criteria, int $index): void
    {
        if (!isset($criteria['type']) || $criteria['type'] !== 'description') {
            return;
        }

        if (empty($criteria['value'])) {
            $validator->errors()->add("criterias.{$index}.value", 'Description value is required.');
        }
    }

    /**
     * Validate amount criteria.
     *
     * @param Validator $validator
     * @param array $criteria
     * @param int $index
     * @return void
     */
    private function validateAmountCriteria(Validator $validator, array $criteria, int $index): void
    {
        if (!isset($criteria['type']) || $criteria['type'] !== 'amount') {
            return;
        }

        if (empty($criteria['value'])) {
            $validator->errors()->add("criterias.{$index}.value", 'Amount value is required.');
            return;
        }

        if (!is_numeric($criteria['value'])) {
            $validator->errors()->add("criterias.{$index}.value", 'Amount value must be a number.');
            return;
        }

        if (isset($criteria['match_type']) && in_array($criteria['match_type'], ['greater_than', 'less_than'])) {
            if (!is_numeric($criteria['value'])) {
                $validator->errors()->add("criterias.{$index}.value", 'Amount value must be a number.');
            }
        }
    }

    /**
     * Validate date criteria.
     *
     * @param Validator $validator
     * @param array $criteria
     * @param int $index
     * @return void
     */
    private function validateDateCriteria(Validator $validator, array $criteria, int $index): void
    {
        if (!isset($criteria['type']) || $criteria['type'] !== 'date') {
            return;
        }

        if (!isset($criteria['match_type'])) {
            return;
        }

        switch ($criteria['match_type']) {
            case 'exact':
                $this->validateExactDateCriteria($validator, $criteria, $index);
                break;
            case 'day_of_month':
                $this->validateDayOfMonthCriteria($validator, $criteria, $index);
                break;
            case 'day_of_week':
                $this->validateDayOfWeekCriteria($validator, $criteria, $index);
                break;
        }
    }

    /**
     * Validate exact date criteria.
     *
     * @param Validator $validator
     * @param array $criteria
     * @param int $index
     * @return void
     */
    private function validateExactDateCriteria(Validator $validator, array $criteria, int $index): void
    {
        if (empty($criteria['value'])) {
            $validator->errors()->add("criterias.{$index}.value", 'Date value is required for exact date criteria.');
            return;
        }

        if (!strtotime($criteria['value'])) {
            $validator->errors()->add("criterias.{$index}.value", 'Please enter a valid date (YYYY-MM-DD format).');
        }
    }

    /**
     * Validate day of month criteria.
     *
     * @param Validator $validator
     * @param array $criteria
     * @param int $index
     * @return void
     */
    private function validateDayOfMonthCriteria(Validator $validator, array $criteria, int $index): void
    {
        if (empty($criteria['day_of_month'])) {
            $validator->errors()->add("criterias.{$index}.day_of_month", 'Day of month is required for day of month criteria.');
            return;
        }

        $day = intval($criteria['day_of_month']);
        if ($day < 1 || $day > 31) {
            $validator->errors()->add("criterias.{$index}.day_of_month", 'Day of month must be between 1 and 31.');
        }
    }

    /**
     * Validate day of week criteria.
     *
     * @param Validator $validator
     * @param array $criteria
     * @param int $index
     * @return void
     */
    private function validateDayOfWeekCriteria(Validator $validator, array $criteria, int $index): void
    {
        if (empty($criteria['day_of_week'])) {
            $validator->errors()->add("criterias.{$index}.day_of_week", 'Day of week is required for day of week criteria.');
            return;
        }

        $day = intval($criteria['day_of_week']);
        if ($day < 1 || $day > 7) {
            $validator->errors()->add("criterias.{$index}.day_of_week", 'Day of week must be between 1 and 7.');
        }
    }

    /**
     * Validate tag name uniqueness for creating a new tag.
     *
     * @param Validator $validator
     * @param string $name
     * @return void
     */
    public function validateTagNameUniqueness(Validator $validator, string $name): void
    {
        /** @var User $user */
        $user = Auth::user();
        if ($user->tags()->where('name', $name)->exists()) {
            $validator->errors()->add('name', 'You already have a tag with this name.');
        }
    }

    /**
     * Validate tag name uniqueness for updating an existing tag.
     *
     * @param Validator $validator
     * @param string $name
     * @param int $tagId
     * @return void
     */
    public function validateTagNameUniquenessForUpdate(Validator $validator, string $name, int $tagId): void
    {
        /** @var User $user */
        $user = Auth::user();
        if ($user->tags()->where('name', $name)->where('id', '!=', $tagId)->exists()) {
            $validator->errors()->add('name', 'You already have a tag with this name.');
        }
    }

    /**
     * Clean and prepare tag data for validation.
     *
     * @param array $data
     * @return array
     */
    public function prepareTagData(array $data): array
    {
        if (isset($data['name'])) {
            $data['name'] = trim($data['name']);
        }

        if (isset($data['description'])) {
            $data['description'] = trim($data['description']);
        } else {
            $data['description'] = null;
        }

        if ($data['description'] === '') {
            $data['description'] = null;
        }

        return $data;
    }
}
