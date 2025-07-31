<?php

namespace Database\Factories;

use App\Models\CsvSchema;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CsvSchema>
 */
class CsvSchemaFactory extends Factory
{
    protected $model = CsvSchema::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => $this->faker->words(2, true).' Schema',
            'transaction_data_start' => $this->faker->numberBetween(1, 5),
            'date_column' => 1, // Column 1
            'balance_column' => 2, // Column 2
            'amount_column' => 3, // Column 3
            'description_column' => 4, // Column 4
            'date_format' => $this->faker->randomElement(['MM/DD/YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY']),
        ];
    }

    /**
     * Create a schema with separate paid in/out columns instead of amount column.
     */
    public function withSeparateAmountColumns(): static
    {
        return $this->state(fn (array $attributes) => [
            'amount_column' => null,
            'paid_in_column' => 3, // Column 3
            'paid_out_column' => 4, // Column 4
        ]);
    }

    /**
     * Create a schema without description column.
     */
    public function withoutDescription(): static
    {
        return $this->state(fn (array $attributes) => [
            'description_column' => null,
        ]);
    }
}
