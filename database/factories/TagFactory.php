<?php

namespace Database\Factories;

use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tag>
 */
class TagFactory extends Factory
{
    protected $model = Tag::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => $this->faker->unique()->word(),
            'color' => $this->faker->hexColor(),
            'description' => $this->faker->sentence(),
            'archived' => false,
        ];
    }

    /**
     * Create a tag without color.
     */
    public function withoutColor(): static
    {
        return $this->state(fn (array $attributes) => [
            'color' => null,
        ]);
    }

    /**
     * Create a tag without description.
     */
    public function withoutDescription(): static
    {
        return $this->state(fn (array $attributes) => [
            'description' => null,
        ]);
    }

    /**
     * Create an archived tag.
     */
    public function archived(): static
    {
        return $this->state(fn (array $attributes) => [
            'archived' => true,
        ]);
    }
}
