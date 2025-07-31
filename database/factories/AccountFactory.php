<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Account>
 */
class AccountFactory extends Factory
{
    protected $model = Account::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => $this->faker->words(2, true).' Account',
            'number' => $this->faker->unique()->numberBetween(10000000, 99999999),
            'sort_code' => $this->faker->numerify('##-##-##'),
            'description' => $this->faker->sentence(),
            'balance_at_start' => $this->faker->numberBetween(-100000, 500000), // -£1000 to £5000 in pence
            'balance' => function (array $attributes) {
                return $attributes['balance_at_start'];
            },
        ];
    }

    /**
     * Indicate that the account should have no starting balance.
     */
    public function withoutStartingBalance(): static
    {
        return $this->state(fn (array $attributes) => [
            'balance_at_start' => 0,
            'balance' => 0,
        ]);
    }
}
