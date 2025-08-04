<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Database\Seeders\DemoUserSeeder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DemoUserController extends Controller
{
    /**
     * Login as demo user and reset data if needed.
     */
    public function login(): RedirectResponse
    {
        $demoUser = User::where('email', 'demo@financetracker.com')->first();

        if (! $demoUser) {
            // If demo user doesn't exist, create it
            $seeder = new DemoUserSeeder;
            $seeder->run();
            $demoUser = User::where('email', 'demo@financetracker.com')->first();
        } else {
            // Check if demo data needs to be reset (every 24 hours)
            if (! $demoUser->demo_last_reset || $demoUser->demo_last_reset->diffInHours(now()) >= 24) {
                $this->resetDemoData($demoUser);
            }
        }

        Auth::login($demoUser);

        return redirect()->route('dashboard.index')->with('status', 'Welcome to the demo! This account resets every 24 hours.');
    }

    /**
     * Reset demo user data.
     */
    private function resetDemoData(User $demoUser): void
    {
        DB::transaction(function () use ($demoUser) {
            // Clear existing demo data
            $demoUser->accounts()->delete();
            $demoUser->tags()->delete();
            $demoUser->csvSchemas()->delete();
            $demoUser->transactions()->delete();

            // Update last reset time
            $demoUser->update([
                'demo_last_reset' => now(),
            ]);

            // Re-seed demo data
            $seeder = new DemoUserSeeder;
            $seeder->run();
        });
    }

    /**
     * Manually reset demo data (for admin use).
     */
    public function reset(): RedirectResponse
    {
        $demoUser = User::where('email', 'demo@financetracker.com')->first();

        if ($demoUser) {
            $this->resetDemoData($demoUser);

            return back()->with('status', 'Demo data has been reset successfully.');
        }

        return back()->with('error', 'Demo user not found.');
    }
}
