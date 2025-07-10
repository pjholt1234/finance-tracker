<?php

namespace Database\Factories;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Transaction>
 */
class TransactionFactory extends Factory
{
    protected $model = Transaction::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'date' => 'encrypted_' . $this->faker->date(),
            'balance' => 'encrypted_' . $this->faker->randomFloat(2, 0, 10000),
            'paid_in' => $this->faker->boolean(50) ? 'encrypted_' . $this->faker->randomFloat(2, 0, 1000) : null,
            'paid_out' => $this->faker->boolean(50) ? 'encrypted_' . $this->faker->randomFloat(2, 0, 1000) : null,
            'description' => 'encrypted_' . $this->faker->sentence(),
            'import_id' => 'import_' . $this->faker->uuid(),
        ];
    }

    /**
     * Create a transaction with only paid_in amount.
     */
    public function paidIn(): static
    {
        return $this->state(fn (array $attributes) => [
            'paid_in' => 'encrypted_' . $this->faker->randomFloat(2, 1, 1000),
            'paid_out' => null,
        ]);
    }

    /**
     * Create a transaction with only paid_out amount.
     */
    public function paidOut(): static
    {
        return $this->state(fn (array $attributes) => [
            'paid_in' => null,
            'paid_out' => 'encrypted_' . $this->faker->randomFloat(2, 1, 1000),
        ]);
    }

    /**
     * Create a transaction without description.
     */
    public function withoutDescription(): static
    {
        return $this->state(fn (array $attributes) => [
            'description' => null,
        ]);
    }
}
