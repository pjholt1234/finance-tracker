<?php

namespace Database\Seeders;

use App\Models\Tag;
use App\Models\TagCriteria;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoTagCriteriaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $demoUser = User::where('email', 'demo@financetracker.com')->first();

        if (!$demoUser) {
            $this->command->error('Demo user not found. Please run DemoUserSeeder first.');
            return;
        }

        // Get demo tags
        $groceries = $demoUser->tags()->where('name', 'Groceries')->first();
        $dining = $demoUser->tags()->where('name', 'Dining Out')->first();
        $utilities = $demoUser->tags()->where('name', 'Utilities')->first();
        $salary = $demoUser->tags()->where('name', 'Salary')->first();
        $gas = $demoUser->tags()->where('name', 'Gas')->first();
        $entertainment = $demoUser->tags()->where('name', 'Entertainment')->first();

        // Clear existing criteria
        $demoUser->tags()->each(function ($tag) {
            $tag->criterias()->delete();
        });

        // Groceries - match common grocery store names
        if ($groceries) {
            TagCriteria::create([
                'tag_id' => $groceries->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'SAFEWAY',
            ]);
            TagCriteria::create([
                'tag_id' => $groceries->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'TRADER JOE',
            ]);
            TagCriteria::create([
                'tag_id' => $groceries->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'WHOLE FOODS',
            ]);
            TagCriteria::create([
                'tag_id' => $groceries->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'KROGER',
            ]);
            TagCriteria::create([
                'tag_id' => $groceries->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'ALBERTSONS',
            ]);
        }

        // Dining Out - match restaurant and food keywords
        if ($dining) {
            TagCriteria::create([
                'tag_id' => $dining->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'RESTAURANT',
            ]);
            TagCriteria::create([
                'tag_id' => $dining->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'PIZZA',
            ]);
            TagCriteria::create([
                'tag_id' => $dining->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'COFFEE',
            ]);
            TagCriteria::create([
                'tag_id' => $dining->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'STARBUCKS',
            ]);
            TagCriteria::create([
                'tag_id' => $dining->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'MCDONALD',
            ]);
            TagCriteria::create([
                'tag_id' => $dining->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'BURGER',
            ]);
        }

        // Utilities - match utility company names
        if ($utilities) {
            TagCriteria::create([
                'tag_id' => $utilities->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'ELECTRIC',
            ]);
            TagCriteria::create([
                'tag_id' => $utilities->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'GAS COMPANY',
            ]);
            TagCriteria::create([
                'tag_id' => $utilities->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'WATER',
            ]);
            TagCriteria::create([
                'tag_id' => $utilities->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'INTERNET',
            ]);
            TagCriteria::create([
                'tag_id' => $utilities->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'CABLE',
            ]);
        }

        // Salary - match payroll keywords
        if ($salary) {
            TagCriteria::create([
                'tag_id' => $salary->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'PAYROLL',
            ]);
            TagCriteria::create([
                'tag_id' => $salary->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'SALARY',
            ]);
            TagCriteria::create([
                'tag_id' => $salary->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'DEPOSIT',
            ]);
        }

        // Gas - match gas station names
        if ($gas) {
            TagCriteria::create([
                'tag_id' => $gas->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'SHELL',
            ]);
            TagCriteria::create([
                'tag_id' => $gas->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'EXXON',
            ]);
            TagCriteria::create([
                'tag_id' => $gas->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'CHEVRON',
            ]);
            TagCriteria::create([
                'tag_id' => $gas->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'BP',
            ]);
            TagCriteria::create([
                'tag_id' => $gas->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'MOBIL',
            ]);
        }

        // Entertainment - match entertainment keywords
        if ($entertainment) {
            TagCriteria::create([
                'tag_id' => $entertainment->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'NETFLIX',
            ]);
            TagCriteria::create([
                'tag_id' => $entertainment->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'SPOTIFY',
            ]);
            TagCriteria::create([
                'tag_id' => $entertainment->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'AMAZON PRIME',
            ]);
            TagCriteria::create([
                'tag_id' => $entertainment->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'DISNEY',
            ]);
            TagCriteria::create([
                'tag_id' => $entertainment->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'MOVIE',
            ]);
        }

        $this->command->info('Demo tag criteria created successfully!');
        $this->command->info('Tags will now automatically apply to matching transactions.');
    }
}
