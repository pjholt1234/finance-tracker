<?php

namespace App\Console\Commands;

use App\Http\Controllers\Auth\DemoUserController;
use App\Models\User;
use Database\Seeders\DemoUserSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResetDemoData extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'demo:reset 
                            {--force : Force reset even if not expired}
                            {--all : Reset all demo users}';

    /**
     * The console command description.
     */
    protected $description = 'Reset demo user data if expired or forced';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $force = $this->option('force');
        $all = $this->option('all');

        if ($all) {
            $demoUsers = User::demo()->get();
        } else {
            $demoUsers = User::where('email', 'demo@financetracker.com')->get();
        }

        if ($demoUsers->isEmpty()) {
            $this->info('No demo users found.');
            return;
        }

        foreach ($demoUsers as $demoUser) {
            $shouldReset = $force ||
                !$demoUser->demo_last_reset ||
                $demoUser->demo_last_reset->diffInHours(now()) >= 24;

            if ($shouldReset) {
                $this->info("Resetting demo data for user: {$demoUser->email}");

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
                    $seeder = new DemoUserSeeder();
                    $seeder->setCommand($this);
                    $seeder->run();
                });

                $this->info("Demo data reset completed for {$demoUser->email}");
            } else {
                $this->info("Demo data for {$demoUser->email} is still fresh (last reset: {$demoUser->demo_last_reset->diffForHumans()})");
            }
        }
    }
}
