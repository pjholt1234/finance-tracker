<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class DemoUserNotification
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check() && Auth::user()->is_demo === true) {
            $timeUntilReset = $this->getTimeUntilReset();

            Inertia::share([
                'isDemoUser' => true,
                'demoTimeUntilReset' => $timeUntilReset,
            ]);
        } else {
            Inertia::share([
                'isDemoUser' => false,
                'demoTimeUntilReset' => null,
            ]);
        }

        return $next($request);
    }

    /**
     * Calculate time until demo data resets.
     */
    private function getTimeUntilReset(): array
    {
        $user = Auth::user();
        $lastReset = $user->demo_last_reset ?? $user->created_at;
        $nextReset = $lastReset->addHours(24);
        $timeUntilReset = now()->diffInSeconds($nextReset, false);

        if ($timeUntilReset <= 0) {
            return [
                'hours' => 0,
                'minutes' => 0,
                'seconds' => 0,
                'expired' => true,
            ];
        }

        return [
            'hours' => floor($timeUntilReset / 3600),
            'minutes' => floor(($timeUntilReset % 3600) / 60),
            'seconds' => $timeUntilReset % 60,
            'expired' => false,
        ];
    }
}
