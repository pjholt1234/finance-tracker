<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\CsvSchema;
use App\Models\Import;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Import>
 */
class ImportFactory extends Factory
{
    protected $model = Import::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'account_id' => Account::factory(),
            'csv_schema_id' => CsvSchema::factory(),
            'filename' => $this->faker->word().'.csv',
            'status' => $this->faker->randomElement(['pending', 'processing', 'completed', 'failed']),
            'total_rows' => $this->faker->numberBetween(10, 1000),
            'processed_rows' => function (array $attributes) {
                return $this->faker->numberBetween(0, $attributes['total_rows']);
            },
            'imported_rows' => function (array $attributes) {
                return $this->faker->numberBetween(0, $attributes['processed_rows']);
            },
            'duplicate_rows' => function (array $attributes) {
                return $this->faker->numberBetween(0, $attributes['processed_rows'] - $attributes['imported_rows']);
            },
            'error_message' => null,
            'started_at' => null,
            'completed_at' => null,
        ];
    }

    /**
     * Create a completed import.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'started_at' => $this->faker->dateTimeBetween('-1 week', '-1 day'),
            'completed_at' => $this->faker->dateTimeBetween($attributes['started_at'], 'now'),
        ]);
    }

    /**
     * Create a failed import.
     */
    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
            'error_message' => $this->faker->sentence(),
            'started_at' => $this->faker->dateTimeBetween('-1 week', '-1 day'),
            'completed_at' => $this->faker->dateTimeBetween($attributes['started_at'], 'now'),
        ]);
    }

    /**
     * Create a processing import.
     */
    public function processing(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'processing',
            'started_at' => $this->faker->dateTimeBetween('-1 hour', 'now'),
        ]);
    }
}
