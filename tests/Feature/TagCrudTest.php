<?php

namespace Tests\Feature;

use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class TagCrudTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create([
            'two_factor_confirmed_at' => now(), // Enable 2FA to avoid middleware redirect
        ]);
    }

    public function test_authenticated_user_can_view_tags_index()
    {
        // Create some active tags
        Tag::factory()->count(3)->create([
            'user_id' => $this->user->id,
        ]);

        // Create one archived tag
        Tag::factory()->archived()->create([
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->get(route('tags.index'));

        $response->assertStatus(200);
        $response->assertInertia(
            fn ($page) => $page
                ->component('tags/index')
                ->has('activeTags', 3)
                ->has('archivedTags', 1)
        );
    }

    public function test_authenticated_user_can_view_create_tag_page()
    {
        $response = $this->actingAs($this->user)->get(route('tags.create'));

        $response->assertStatus(200);
        $response->assertInertia(
            fn ($page) => $page
                ->component('tags/create')
        );
    }

    public function test_authenticated_user_can_create_tag_via_form()
    {
        $tagData = [
            'name' => 'New Tag',
            'color' => '#ef4444',
            'description' => 'A new test tag',
        ];

        $response = $this->actingAs($this->user)->post(route('tags.store'), $tagData);

        $response->assertRedirect(route('tags.index'));
        $response->assertSessionHas('success', 'Tag created successfully.');

        $this->assertDatabaseHas('tags', [
            'user_id' => $this->user->id,
            'name' => 'New Tag',
            'color' => '#ef4444',
            'description' => 'A new test tag',
        ]);
    }

    public function test_authenticated_user_can_view_edit_tag_page()
    {
        $tag = Tag::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->get(route('tags.edit', $tag));

        $response->assertStatus(200);
        $response->assertInertia(
            fn ($page) => $page
                ->component('tags/edit')
                ->has('tag')
                ->where('tag.id', $tag->id)
        );
    }

    public function test_authenticated_user_can_update_tag()
    {
        $tag = Tag::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Old Name',
            'color' => '#ef4444',
            'description' => 'Old description',
        ]);

        $updatedData = [
            'name' => 'Updated Name',
            'color' => '#22c55e',
            'description' => 'Updated description',
        ];

        $response = $this->actingAs($this->user)->put(route('tags.update', $tag), $updatedData);

        $response->assertRedirect(route('tags.index'));
        $response->assertSessionHas('success', 'Tag updated successfully.');

        $this->assertDatabaseHas('tags', [
            'id' => $tag->id,
            'user_id' => $this->user->id,
            'name' => 'Updated Name',
            'color' => '#22c55e',
            'description' => 'Updated description',
        ]);
    }

    public function test_authenticated_user_can_delete_tag()
    {
        $tag = Tag::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->delete(route('tags.destroy', $tag));

        $response->assertRedirect(route('tags.index'));
        $response->assertSessionHas('success', 'Tag deleted successfully.');

        $this->assertDatabaseMissing('tags', [
            'id' => $tag->id,
        ]);
    }

    public function test_user_cannot_edit_other_users_tag()
    {
        $otherUser = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);

        $otherUserTag = Tag::factory()->create([
            'user_id' => $otherUser->id,
        ]);

        $response = $this->actingAs($this->user)->get(route('tags.edit', $otherUserTag));

        $response->assertStatus(403);
    }

    public function test_user_cannot_update_other_users_tag()
    {
        $otherUser = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);

        $otherUserTag = Tag::factory()->create([
            'user_id' => $otherUser->id,
        ]);

        $response = $this->actingAs($this->user)->put(route('tags.update', $otherUserTag), [
            'name' => 'Updated Name',
            'color' => '#22c55e',
        ]);

        $response->assertStatus(403);
    }

    public function test_user_cannot_delete_other_users_tag()
    {
        $otherUser = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);

        $otherUserTag = Tag::factory()->create([
            'user_id' => $otherUser->id,
        ]);

        $response = $this->actingAs($this->user)->delete(route('tags.destroy', $otherUserTag));

        $response->assertStatus(403);
    }

    public function test_cannot_delete_tag_with_transactions()
    {
        $tag = Tag::factory()->create([
            'user_id' => $this->user->id,
        ]);

        // Create a transaction and attach the tag
        $transaction = \App\Models\Transaction::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $tag->transactions()->attach($transaction->id);

        $response = $this->actingAs($this->user)->delete(route('tags.destroy', $tag));

        $response->assertRedirect();
        $response->assertSessionHas('error', 'Cannot delete tag that has associated transactions.');

        $this->assertDatabaseHas('tags', [
            'id' => $tag->id,
        ]);
    }

    public function test_tag_update_validates_duplicate_name_for_same_user()
    {
        $tag1 = Tag::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'First Tag',
        ]);

        $tag2 = Tag::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Second Tag',
        ]);

        $response = $this->actingAs($this->user)->put(route('tags.update', $tag2), [
            'name' => 'First Tag', // Try to use the same name as tag1
            'color' => '#ef4444',
        ]);

        $response->assertSessionHasErrors(['name']);
        $response->assertSessionHasErrors(['name' => 'You already have a tag with this name.']);
    }

    public function test_tag_update_allows_same_name_for_different_users()
    {
        $otherUser = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);

        $tag1 = Tag::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Same Name',
        ]);

        $tag2 = Tag::factory()->create([
            'user_id' => $otherUser->id,
            'name' => 'Different Name',
        ]);

        $response = $this->actingAs($otherUser)->put(route('tags.update', $tag2), [
            'name' => 'Same Name', // Same name as tag1 but different user
            'color' => '#ef4444',
        ]);

        $response->assertRedirect(route('tags.index'));
        $response->assertSessionHas('success', 'Tag updated successfully.');
    }

    public function test_unauthenticated_user_cannot_access_tag_pages()
    {
        $tag = Tag::factory()->create();

        $this->get(route('tags.index'))->assertRedirect('/login');
        $this->get(route('tags.create'))->assertRedirect('/login');
        $this->post(route('tags.store'))->assertRedirect('/login');
        $this->get(route('tags.show', $tag))->assertRedirect('/login');
        $this->get(route('tags.edit', $tag))->assertRedirect('/login');
        $this->put(route('tags.update', $tag))->assertRedirect('/login');
        $this->delete(route('tags.destroy', $tag))->assertRedirect('/login');
    }

    public function test_authenticated_user_can_archive_tag()
    {
        $tag = Tag::factory()->create([
            'user_id' => $this->user->id,
            'archived' => false,
        ]);

        $response = $this->actingAs($this->user)->post(route('tags.archive', $tag));

        $response->assertRedirect(route('tags.index'));
        $response->assertSessionHas('success', 'Tag archived successfully.');

        $this->assertDatabaseHas('tags', [
            'id' => $tag->id,
            'archived' => true,
        ]);
    }

    public function test_authenticated_user_can_unarchive_tag()
    {
        $tag = Tag::factory()->archived()->create([
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->post(route('tags.unarchive', $tag));

        $response->assertRedirect(route('tags.index'));
        $response->assertSessionHas('success', 'Tag unarchived successfully.');

        $this->assertDatabaseHas('tags', [
            'id' => $tag->id,
            'archived' => false,
        ]);
    }

    public function test_user_cannot_archive_other_users_tag()
    {
        $tag = Tag::factory()->create([
            'archived' => false,
        ]);

        $response = $this->actingAs($this->user)->post(route('tags.archive', $tag));

        $response->assertStatus(403);
    }

    public function test_user_cannot_unarchive_other_users_tag()
    {
        $tag = Tag::factory()->archived()->create();

        $response = $this->actingAs($this->user)->post(route('tags.unarchive', $tag));

        $response->assertStatus(403);
    }

    public function test_tag_criteria_logic_type_consistency()
    {
        $tag = Tag::factory()->create([
            'user_id' => $this->user->id,
        ]);

        // Create initial criteria with different logic types
        $tag->criterias()->create([
            'type' => 'description',
            'match_type' => 'contains',
            'value' => 'test',
            'logic_type' => 'and',
        ]);

        $tag->criterias()->create([
            'type' => 'amount',
            'match_type' => 'greater_than',
            'value' => '100',
            'logic_type' => 'or',
        ]);

        // Update the tag with new criteria, setting the first one to 'or'
        $updatedData = [
            'name' => 'Updated Tag',
            'criterias' => [
                [
                    'type' => 'description',
                    'match_type' => 'contains',
                    'value' => 'updated',
                    'logic_type' => 'or',
                ],
                [
                    'type' => 'amount',
                    'match_type' => 'less_than',
                    'value' => '200',
                    'logic_type' => 'and', // This should be overridden to 'or'
                ],
            ],
        ];

        $response = $this->actingAs($this->user)->put(route('tags.update', $tag), $updatedData);

        $response->assertRedirect(route('tags.index'));

        // Verify that all criteria now have the same logic_type ('or')
        $tag->refresh();
        $this->assertEquals(2, $tag->criterias->count());

        foreach ($tag->criterias as $criteria) {
            $this->assertEquals('or', $criteria->logic_type);
        }
    }
}
