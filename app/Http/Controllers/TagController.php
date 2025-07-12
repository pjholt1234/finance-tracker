<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class TagController extends Controller
{
    use AuthorizesRequests;

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

        // Check for duplicate tag name for this user
        if (Auth::user()->tags()->where('name', $validated['name'])->exists()) {
            throw ValidationException::withMessages([
                'name' => 'You already have a tag with this name.',
            ]);
        }

        $tagData = [
            'name' => $validated['name'],
            'color' => $validated['color'] ?? $this->generateRandomColor(),
        ];

        // Only add description if it's provided
        if (!empty($validated['description'])) {
            $tagData['description'] = $validated['description'];
        }

        $tag = Auth::user()->tags()->create($tagData);

        // Return JSON for AJAX requests, redirect for form submissions
        if ($request->expectsJson() || $request->header('X-Inertia')) {
            return response()->json($tag);
        }

        return back()->with('success', 'Tag created successfully.');
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
