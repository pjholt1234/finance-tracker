<?php

namespace Tests\Unit;

use App\Models\Tag;
use App\Models\TagCriteria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TagCriteriaTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Tag $tag;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->tag = Tag::factory()->create([
            'user_id' => $this->user->id,
        ]);
    }

    public function test_tag_criteria_can_be_created(): void
    {
        $criteria = TagCriteria::create([
            'tag_id' => $this->tag->id,
            'description_match' => 'grocery',
            'match_type' => 'contains',
        ]);

        $this->assertDatabaseHas('tag_criterias', [
            'tag_id' => $this->tag->id,
            'description_match' => 'grocery',
            'match_type' => 'contains',
        ]);
    }

    public function test_tag_relationship(): void
    {
        $criteria = TagCriteria::create([
            'tag_id' => $this->tag->id,
            'description_match' => 'grocery',
        ]);

        $this->assertTrue($criteria->tag->is($this->tag));
    }

    public function test_matches_plain_data_with_exact_description(): void
    {
        $criteria = TagCriteria::create([
            'tag_id' => $this->tag->id,
            'description_match' => 'grocery store',
            'match_type' => 'exact',
        ]);

        $this->assertTrue($criteria->matchesPlainData('grocery store'));
        $this->assertFalse($criteria->matchesPlainData('GROCERY STORE')); // Case sensitive
        $this->assertFalse($criteria->matchesPlainData('grocery'));
    }

    public function test_matches_plain_data_with_contains_description(): void
    {
        $criteria = TagCriteria::create([
            'tag_id' => $this->tag->id,
            'description_match' => 'grocery',
            'match_type' => 'contains',
        ]);

        $this->assertTrue($criteria->matchesPlainData('grocery store'));
        $this->assertTrue($criteria->matchesPlainData('local grocery'));
        $this->assertTrue($criteria->matchesPlainData('GROCERY STORE')); // Case insensitive
        $this->assertFalse($criteria->matchesPlainData('food market'));
    }

    public function test_matches_plain_data_with_starts_with_description(): void
    {
        $criteria = TagCriteria::create([
            'tag_id' => $this->tag->id,
            'description_match' => 'grocery',
            'match_type' => 'starts_with',
        ]);

        $this->assertTrue($criteria->matchesPlainData('grocery store'));
        $this->assertTrue($criteria->matchesPlainData('GROCERY MART'));
        $this->assertFalse($criteria->matchesPlainData('local grocery'));
        $this->assertFalse($criteria->matchesPlainData('food market'));
    }

    public function test_matches_plain_data_with_ends_with_description(): void
    {
        $criteria = TagCriteria::create([
            'tag_id' => $this->tag->id,
            'description_match' => 'store',
            'match_type' => 'ends_with',
        ]);

        $this->assertTrue($criteria->matchesPlainData('grocery store'));
        $this->assertTrue($criteria->matchesPlainData('CONVENIENCE STORE'));
        $this->assertFalse($criteria->matchesPlainData('store manager'));
        $this->assertFalse($criteria->matchesPlainData('food market'));
    }

    public function test_matches_plain_data_with_balance(): void
    {
        $criteria = TagCriteria::create([
            'tag_id' => $this->tag->id,
            'balance_match' => 100.50,
        ]);

        $this->assertTrue($criteria->matchesPlainData(null, 100.50));
        $this->assertTrue($criteria->matchesPlainData(null, 100.50)); // Exact match
        $this->assertFalse($criteria->matchesPlainData(null, 100.51)); // Different value
        $this->assertFalse($criteria->matchesPlainData(null, 101.00));
        $this->assertFalse($criteria->matchesPlainData(null, 50.00));
    }

    public function test_matches_plain_data_with_date(): void
    {
        $criteria = TagCriteria::create([
            'tag_id' => $this->tag->id,
            'date_match' => '2024-01-15',
        ]);

        $this->assertTrue($criteria->matchesPlainData(null, null, '2024-01-15'));
        $this->assertFalse($criteria->matchesPlainData(null, null, '2024-01-16'));
        $this->assertFalse($criteria->matchesPlainData(null, null, '2023-01-15'));
    }

    public function test_matches_plain_data_with_multiple_criteria_all_must_match(): void
    {
        $criteria = TagCriteria::create([
            'tag_id' => $this->tag->id,
            'description_match' => 'grocery',
            'balance_match' => 50.00,
            'match_type' => 'contains',
        ]);

        // Both criteria match
        $this->assertTrue($criteria->matchesPlainData('grocery store', 50.00));
        
        // Only description matches
        $this->assertFalse($criteria->matchesPlainData('grocery store', 100.00));
        
        // Only balance matches
        $this->assertFalse($criteria->matchesPlainData('food market', 50.00));
        
        // Neither matches
        $this->assertFalse($criteria->matchesPlainData('food market', 100.00));
    }

    public function test_matches_plain_data_returns_false_when_no_criteria_set(): void
    {
        $criteria = TagCriteria::create([
            'tag_id' => $this->tag->id,
        ]);

        $this->assertFalse($criteria->matchesPlainData('anything', 100.00, '2024-01-15'));
    }

    public function test_matches_plain_data_with_partial_data(): void
    {
        $criteria = TagCriteria::create([
            'tag_id' => $this->tag->id,
            'description_match' => 'grocery',
            'balance_match' => 50.00,
            'match_type' => 'contains',
        ]);

        // Only provide description (balance criteria can't be checked)
        $this->assertFalse($criteria->matchesPlainData('grocery store'));
        
        // Only provide balance (description criteria can't be checked)
        $this->assertFalse($criteria->matchesPlainData(null, 50.00));
    }

    public function test_casts_work_correctly(): void
    {
        $criteria = TagCriteria::create([
            'tag_id' => $this->tag->id,
            'balance_match' => '100.50',
            'date_match' => '2024-01-15',
        ]);

        $this->assertIsFloat($criteria->balance_match);
        $this->assertInstanceOf(\Carbon\Carbon::class, $criteria->date_match);
        $this->assertEquals(100.50, $criteria->balance_match);
        $this->assertEquals('2024-01-15', $criteria->date_match->format('Y-m-d'));
    }
}
