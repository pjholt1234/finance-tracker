<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTagRequest;
use App\Http\Requests\UpdateTagRequest;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class TagController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of the tags.
     */
    public function index()
    {
        /** @var User $user */
        $user = Auth::user();

        $tags = $user->tags()
            ->withCount('transactions')
            ->orderBy('name')
            ->get();

        return Inertia::render('tags/index', [
            'tags' => $tags,
        ]);
    }

    /**
     * Show the form for creating a new tag.
     */
    public function create()
    {
        $this->authorize('create', Tag::class);
        return Inertia::render('tags/create');
    }

    /**
     * Store a newly created tag.
     */
    public function store(StoreTagRequest $request)
    {
        $this->authorize('create', Tag::class);

        /** @var User $user */
        $user = Auth::user();

        $tag = $user->tags()->create([
            'name' => $request->name,
            'color' => $request->color ?? Tag::generateRandomColor(),
            'description' => $request->description ?? null,
        ]);

        // Create criteria if provided
        if ($request->has('criterias') && is_array($request->criterias)) {
            foreach ($request->criterias as $criteriaData) {
                $tag->criterias()->create([
                    'type' => $criteriaData['type'],
                    'match_type' => $criteriaData['match_type'],
                    'value' => $criteriaData['value'],
                    'value_to' => $criteriaData['value_to'] ?? null,
                    'day_of_month' => $criteriaData['day_of_month'] ?? null,
                    'day_of_week' => $criteriaData['day_of_week'] ?? null,
                    'logic_type' => $criteriaData['logic_type'] ?? 'and',
                ]);
            }
        }

        if ($request->expect_json) {
            return response()->json($tag, 201);
        }

        return redirect()->route('tags.index')->with('success', 'Tag created successfully.');
    }

    /**
     * Display the specified tag.
     */
    public function show(Tag $tag)
    {
        $this->authorize('view', $tag);

        $tag->load(['transactions' => function ($query) {
            $query->latest('date')->limit(10);
        }, 'criterias']);

        return Inertia::render('tags/show', [
            'tag' => $tag,
        ]);
    }

    /**
     * Show the form for editing the specified tag.
     */
    public function edit(Tag $tag)
    {
        $this->authorize('update', $tag);

        return Inertia::render('tags/edit', [
            'tag' => $tag,
        ]);
    }

    /**
     * Update the specified tag.
     */
    public function update(UpdateTagRequest $request, Tag $tag)
    {
        $this->authorize('update', $tag);

        $validated = $request->validated();
        $tag->update($validated);

        return redirect()->route('tags.index')->with('success', 'Tag updated successfully.');
    }

    /**
     * Remove the specified tag.
     */
    public function destroy(Tag $tag)
    {
        $this->authorize('delete', $tag);

        if ($tag->transactions()->count() > 0) {
            return back()->with('error', 'Cannot delete tag that has associated transactions.');
        }

        $tag->delete();

        return redirect()->route('tags.index')->with('success', 'Tag deleted successfully.');
    }

    /**
     * Get tag suggestions based on transaction criteria.
     */
    public function suggestions(Request $request)
    {
        $this->authorize('viewAny', Tag::class);

        $request->validate([
            'description' => 'nullable|string',
            'amount' => 'nullable|numeric',
            'date' => 'nullable|date',
        ]);

        /** @var User $user */
        $user = Auth::user();

        $description = $request->input('description');
        $amount = $request->input('amount');
        $date = $request->input('date');

        Log::info('Tag suggestions request', [
            'user_id' => $user->id,
            'description' => $description,
            'amount' => $amount,
            'date' => $date,
        ]);

        // Get all user's tags with criteria
        $tags = $user->tags()
            ->with('criterias')
            ->get();

        Log::info('Found tags with criteria', [
            'total_tags' => $tags->count(),
            'tags_with_criteria' => $tags->filter(fn($tag) => $tag->criterias->isNotEmpty())->count(),
        ]);

        $suggestedTags = [];

        foreach ($tags as $tag) {
            if ($tag->criterias->isEmpty()) {
                continue;
            }

            $matches = 0;
            $totalCriteria = $tag->criterias->count();

            foreach ($tag->criterias as $criteria) {
                if ($criteria->matchesTransaction($description, $amount, $date)) {
                    $matches++;
                }
            }

            // Use the logic type to determine if all criteria must match (AND) or any criteria (OR)
            $logicType = $tag->criterias->first()?->logic_type ?? 'and';

            $shouldSuggest = match ($logicType) {
                'and' => $matches === $totalCriteria,
                'or' => $matches > 0,
                default => $matches === $totalCriteria,
            };

            if ($shouldSuggest) {
                $suggestedTags[] = [
                    'id' => $tag->id,
                    'name' => $tag->name,
                    'color' => $tag->color,
                    'description' => $tag->description,
                    'match_count' => $matches,
                    'total_criteria' => $totalCriteria,
                    'is_recommended' => true,
                ];
            }
        }

        // Sort by match count (highest first) and then by name
        usort($suggestedTags, function ($a, $b) {
            if ($a['match_count'] !== $b['match_count']) {
                return $b['match_count'] - $a['match_count'];
            }
            return strcmp($a['name'], $b['name']);
        });

        Log::info('Returning suggested tags', [
            'suggested_count' => count($suggestedTags),
        ]);

        return response()->json($suggestedTags);
    }
}
