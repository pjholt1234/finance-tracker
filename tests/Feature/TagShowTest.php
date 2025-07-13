<?php

namespace Tests\Feature;

use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TagShowTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);
    }

    public function test_authenticated_user_can_view_tag_show_page()
    {
        $tag = Tag::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Test Tag',
            'color' => '#ef4444',
            'description' => 'A test tag',
        ]);

        $response = $this->actingAs($this->user)->get(route('tags.show', $tag));

        $response->assertStatus(200);
        $response->assertInertia(
            fn($page) => $page
                ->component('tags/show')
                ->has('tag')
                ->where('tag.id', $tag->id)
                ->where('tag.name', 'Test Tag')
        );
    }

    public function test_user_cannot_view_other_users_tag()
    {
        $otherUser = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);

        $otherUserTag = Tag::factory()->create([
            'user_id' => $otherUser->id,
        ]);

        $response = $this->actingAs($this->user)->get(route('tags.show', $otherUserTag));

        $response->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_view_tag()
    {
        $tag = Tag::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $response = $this->get(route('tags.show', $tag));

        $response->assertRedirect('/login');
    }
}
