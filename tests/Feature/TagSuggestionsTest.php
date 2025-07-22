<?php

namespace Tests\Feature;

use App\Models\Tag;
use App\Models\TagCriteria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TagSuggestionsTest extends TestCase
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

    public function test_tag_suggestions_endpoint_returns_matching_tags()
    {
        // Create a tag with description criteria
        $tag = Tag::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Nationwide Card',
            'color' => '#ff0000',
        ]);

        TagCriteria::create([
            'tag_id' => $tag->id,
            'type' => 'description',
            'match_type' => 'contains',
            'value' => 'NATIONWIDE',
        ]);

        // Create another tag with amount criteria
        $amountTag = Tag::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Large Transaction',
            'color' => '#00ff00',
        ]);

        TagCriteria::create([
            'tag_id' => $amountTag->id,
            'type' => 'amount',
            'match_type' => 'greater_than',
            'value' => '500',
        ]);

        $response = $this->actingAs($this->user)
            ->get('/api/tags/suggestions?description=NATIONWIDE+C%2FCARD&date=2024-07-12&amount=762.49');

        $response->assertStatus(200);
        $data = $response->json();

        // Should return both tags since description contains "NATIONWIDE" and amount > 500
        $this->assertCount(2, $data);

        // Check that both tags are returned
        $tagNames = collect($data)->pluck('name')->toArray();
        $this->assertContains('Nationwide Card', $tagNames);
        $this->assertContains('Large Transaction', $tagNames);
    }

    public function test_tag_suggestions_returns_empty_array_when_no_matches()
    {
        // Create a tag with criteria that won't match
        $tag = Tag::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Test Tag',
            'color' => '#ff0000',
        ]);

        TagCriteria::create([
            'tag_id' => $tag->id,
            'type' => 'description',
            'match_type' => 'contains',
            'value' => 'SOMETHING_ELSE',
        ]);

        $response = $this->actingAs($this->user)
            ->get('/api/tags/suggestions?description=NATIONWIDE+C%2FCARD&date=2024-07-12&amount=762.49');

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertCount(0, $data);
    }

    public function test_tag_suggestions_ignores_tags_without_criteria()
    {
        // Create a tag without criteria
        $tag = Tag::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'No Criteria Tag',
            'color' => '#ff0000',
        ]);

        $response = $this->actingAs($this->user)
            ->get('/api/tags/suggestions?description=NATIONWIDE+C%2FCARD&date=2024-07-12&amount=762.49');

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertCount(0, $data);
    }

    public function test_tag_suggestions_requires_authentication()
    {
        $response = $this->get('/api/tags/suggestions?description=test&date=2024-07-12&amount=100');

        $response->assertRedirect('/login');
    }

    public function test_tag_suggestions_validates_input_parameters()
    {
        $response = $this->actingAs($this->user)
            ->get('/api/tags/suggestions?amount=invalid');

        $response->assertStatus(302); // Laravel redirects on validation failure
    }
}
