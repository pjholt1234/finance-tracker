<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class RequireTwoFactor
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (App::environment('local')) {
            return $next($request);
        }

        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        // Bypass 2FA for demo users
        if ($user->is_demo) {
            return $next($request);
        }

        if ($user->two_factor_confirmed_at) {
            return $next($request);
        }

        $allowedRoutes = [
            'two-factor.show',
            'logout',
        ];

        $allowedPaths = [
            '/user/two-factor-authentication',
            '/user/confirmed-two-factor-authentication',
            '/user/two-factor-recovery-codes',
            '/settings/two-factor',
            '/logout',
        ];

        if (
            in_array($request->route()?->getName(), $allowedRoutes) ||
            in_array($request->path(), $allowedPaths) ||
            str_starts_with($request->path(), 'user/')
        ) {
            return $next($request);
        }

        return redirect()->route('two-factor.show')->with('message', 'You must enable two-factor authentication to continue.');
    }
}
