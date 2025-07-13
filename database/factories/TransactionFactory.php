<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Import;
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
            'account_id' => Account::factory(),
            'date' => $this->faker->date(),
            'balance' => $this->faker->numberBetween(0, 1000000), // £0 to £10,000 in pennies
            'paid_in' => $this->faker->boolean(50) ? $this->faker->numberBetween(1, 100000) : null, // £0.01 to £1,000 in pennies
            'paid_out' => $this->faker->boolean(50) ? $this->faker->numberBetween(1, 100000) : null, // £0.01 to £1,000 in pennies
            'description' => $this->faker->sentence(),
            'import_id' => Import::factory(),
        ];
    }

    /**
     * Create a transaction with only paid_in amount.
     */
    public function paidIn(): static
    {
        return $this->state(fn(array $attributes) => [
            'paid_in' => $this->faker->numberBetween(100, 100000), // £1 to £1,000 in pennies
            'paid_out' => null,
        ]);
    }

    /**
     * Create a transaction with only paid_out amount.
     */
    public function paidOut(): static
    {
        return $this->state(fn(array $attributes) => [
            'paid_in' => null,
            'paid_out' => $this->faker->numberBetween(100, 100000), // £1 to £1,000 in pennies
        ]);
    }

    /**
     * Create a transaction without description.
     */
    public function withoutDescription(): static
    {
        return $this->state(fn(array $attributes) => [
            'description' => null,
        ]);
    }
}
