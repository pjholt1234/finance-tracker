<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        $tags = Auth::user()->tags()
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
        return Inertia::render('tags/create');
    }

    /**
     * Store a newly created tag.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'nullable|string|max:7', // Hex color
            'description' => 'nullable|string|max:500',
        ]);

        // Trim whitespace from name and description
        $validated['name'] = trim($validated['name']);
        if (isset($validated['description'])) {
            $validated['description'] = trim($validated['description']);
            // Convert empty string to null
            if ($validated['description'] === '') {
                $validated['description'] = null;
            }
        }

        // Check for duplicate tag name for this user
        if (Auth::user()->tags()->where('name', $validated['name'])->exists()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => [
                        'name' => ['You already have a tag with this name.']
                    ]
                ], 422);
            }

            throw ValidationException::withMessages([
                'name' => 'You already have a tag with this name.',
            ]);
        }

        $tagData = [
            'name' => $validated['name'],
            'color' => $validated['color'] ?? $this->generateRandomColor(),
            'description' => $validated['description'] ?? null,
        ];

        $tag = Auth::user()->tags()->create($tagData);

        // Return JSON for AJAX requests, redirect for form submissions
        if ($request->expectsJson() || $request->header('X-Inertia')) {
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
    public function update(Request $request, Tag $tag)
    {
        $this->authorize('update', $tag);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'nullable|string|max:7', // Hex color
            'description' => 'nullable|string|max:500',
        ]);

        // Trim whitespace from name and description
        $validated['name'] = trim($validated['name']);
        if (isset($validated['description'])) {
            $validated['description'] = trim($validated['description']);
            // Convert empty string to null
            if ($validated['description'] === '') {
                $validated['description'] = null;
            }
        }

        // Check for duplicate tag name for this user (excluding current tag)
        if (Auth::user()->tags()->where('name', $validated['name'])->where('id', '!=', $tag->id)->exists()) {
            throw ValidationException::withMessages([
                'name' => 'You already have a tag with this name.',
            ]);
        }

        $tag->update($validated);

        return redirect()->route('tags.index')->with('success', 'Tag updated successfully.');
    }

    /**
     * Remove the specified tag.
     */
    public function destroy(Tag $tag)
    {
        $this->authorize('delete', $tag);

        // Check if tag has any transactions
        if ($tag->transactions()->count() > 0) {
            return back()->with('error', 'Cannot delete tag that has associated transactions.');
        }

        $tag->delete();

        return redirect()->route('tags.index')->with('success', 'Tag deleted successfully.');
    }

    /**
     * Generate a random color for the tag.
     */
    private function generateRandomColor(): string
    {
        $colors = [
            '#ef4444',
            '#f97316',
            '#f59e0b',
            '#eab308',
            '#84cc16',
            '#22c55e',
            '#10b981',
            '#14b8a6',
            '#06b6d4',
            '#0ea5e9',
            '#3b82f6',
            '#6366f1',
            '#8b5cf6',
            '#a855f7',
            '#d946ef',
            '#ec4899',
            '#f43f5e'
        ];

        return $colors[array_rand($colors)];
    }
}
