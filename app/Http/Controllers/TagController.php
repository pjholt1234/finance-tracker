<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTagRequest;
use App\Http\Requests\UpdateTagRequest;
use App\Models\Tag;
use App\Models\User;
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
        $validated = $request->validated();

        /** @var User $user */
        $user = Auth::user();
        $tag = $user->tags()->create([
            'name' => $validated['name'],
            'color' => $validated['color'] ?? Tag::generateRandomColor(),
            'description' => $validated['description'] ?? null,
        ]);

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
}
