<?php

namespace Tests\Feature;

use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class TagTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_authenticated_user_can_create_tag()
    {
        $user = User::factory()->create([
            'two_factor_confirmed_at' => now(), // Enable 2FA to avoid middleware redirect
        ]);

        $response = $this->actingAs($user)->postJson('/tags', [
            'name' => 'Test Tag',
            'description' => 'Test description',
            'expect_json' => true,
        ]);

        $response->assertStatus(201);

        // Check if the archived field is saved to the database
        $this->assertDatabaseHas('tags', [
            'name' => 'Test Tag',
            'description' => 'Test description',
            'user_id' => $user->id,
            'archived' => false,
        ]);

        // Check the response structure
        $response->assertJsonStructure([
            'id',
            'name',
            'description',
            'color',
            'user_id',
            'created_at',
            'updated_at',
        ]);

        // Check that archived field is present in response
        $responseData = $response->json();
        $this->assertArrayHasKey('archived', $responseData);
        $this->assertFalse($responseData['archived']);
    }

    public function test_unauthenticated_user_cannot_create_tag()
    {
        $response = $this->postJson('/tags', [
            'name' => 'Test Tag',
            'expect_json' => true,
        ]);

        $response->assertStatus(401);
    }

    public function test_tag_name_is_required()
    {
        $user = User::factory()->create([
            'two_factor_confirmed_at' => now(), // Enable 2FA to avoid middleware redirect
        ]);

        $response = $this->actingAs($user)->postJson('/tags', [
            'description' => 'Test description',
            'expect_json' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_tag_name_must_be_unique_per_user()
    {
        $user = User::factory()->create([
            'two_factor_confirmed_at' => now(), // Enable 2FA to avoid middleware redirect
        ]);
        $otherUser = User::factory()->create([
            'two_factor_confirmed_at' => now(), // Enable 2FA to avoid middleware redirect
        ]);

        // Create tag for first user
        Tag::factory()->create([
            'name' => 'Duplicate Tag',
            'user_id' => $user->id,
        ]);

        // Same user cannot create duplicate tag
        $response = $this->actingAs($user)->postJson('/tags', [
            'name' => 'Duplicate Tag',
            'expect_json' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);

        // Different user can create tag with same name
        $response = $this->actingAs($otherUser)->postJson('/tags', [
            'name' => 'Duplicate Tag',
            'expect_json' => true,
        ]);

        $response->assertStatus(201);
    }

    public function test_tag_name_has_max_length()
    {
        $user = User::factory()->create([
            'two_factor_confirmed_at' => now(), // Enable 2FA to avoid middleware redirect
        ]);

        $response = $this->actingAs($user)->postJson('/tags', [
            'name' => str_repeat('a', 256), // Exceeds 255 character limit
            'expect_json' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_tag_description_is_optional()
    {
        $user = User::factory()->create([
            'two_factor_confirmed_at' => now(), // Enable 2FA to avoid middleware redirect
        ]);

        $response = $this->actingAs($user)->postJson('/tags', [
            'name' => 'Test Tag',
            'expect_json' => true,
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('tags', [
            'name' => 'Test Tag',
            'description' => null,
            'user_id' => $user->id,
        ]);
    }

    public function test_tag_gets_random_color_when_created()
    {
        $user = User::factory()->create([
            'two_factor_confirmed_at' => now(), // Enable 2FA to avoid middleware redirect
        ]);

        $response = $this->actingAs($user)->postJson('/tags', [
            'name' => 'Test Tag',
            'expect_json' => true,
        ]);

        $response->assertStatus(201);

        $tag = Tag::where('name', 'Test Tag')->first();
        $this->assertNotNull($tag->color);
        $this->assertMatchesRegularExpression('/^#[0-9a-f]{6}$/i', $tag->color);
    }

    public function test_tag_belongs_to_authenticated_user()
    {
        $user = User::factory()->create([
            'two_factor_confirmed_at' => now(), // Enable 2FA to avoid middleware redirect
        ]);

        $response = $this->actingAs($user)->postJson('/tags', [
            'name' => 'Test Tag',
            'expect_json' => true,
        ]);

        $response->assertStatus(201);

        $tag = Tag::where('name', 'Test Tag')->first();
        $this->assertEquals($user->id, $tag->user_id);
    }

    public function test_tag_creation_handles_null_description()
    {
        $user = User::factory()->create([
            'two_factor_confirmed_at' => now(), // Enable 2FA to avoid middleware redirect
        ]);

        $response = $this->actingAs($user)->postJson('/tags', [
            'name' => 'Test Tag',
            'description' => null,
            'expect_json' => true,
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('tags', [
            'name' => 'Test Tag',
            'description' => null,
            'user_id' => $user->id,
        ]);
    }

    public function test_tag_creation_trims_whitespace()
    {
        $user = User::factory()->create([
            'two_factor_confirmed_at' => now(), // Enable 2FA to avoid middleware redirect
        ]);

        $response = $this->actingAs($user)->postJson('/tags', [
            'name' => '  Test Tag  ',
            'description' => '  Test description  ',
            'expect_json' => true,
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('tags', [
            'name' => 'Test Tag',
            'description' => 'Test description',
            'user_id' => $user->id,
        ]);
    }
}
