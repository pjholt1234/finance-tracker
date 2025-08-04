<?php

namespace Database\Seeders;

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

        if (! $demoUser) {
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
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $groceries->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'TRADER JOE',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $groceries->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'WHOLE FOODS',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $groceries->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'KROGER',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $groceries->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'ALBERTSONS',
                'logic_type' => 'or',
            ]);
        }

        // Dining Out - match restaurant and food keywords
        if ($dining) {
            TagCriteria::create([
                'tag_id' => $dining->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'RESTAURANT',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $dining->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'PIZZA',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $dining->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'COFFEE',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $dining->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'STARBUCKS',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $dining->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'MCDONALD',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $dining->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'BURGER',
                'logic_type' => 'or',
            ]);
        }

        // Utilities - match utility company names
        if ($utilities) {
            TagCriteria::create([
                'tag_id' => $utilities->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'ELECTRIC',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $utilities->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'GAS COMPANY',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $utilities->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'WATER',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $utilities->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'INTERNET',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $utilities->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'CABLE',
                'logic_type' => 'or',
            ]);
        }

        // Salary - match payroll keywords
        if ($salary) {
            TagCriteria::create([
                'tag_id' => $salary->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'PAYROLL',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $salary->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'SALARY',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $salary->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'DEPOSIT',
                'logic_type' => 'or',
            ]);
        }

        // Gas - match gas station names
        if ($gas) {
            TagCriteria::create([
                'tag_id' => $gas->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'SHELL',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $gas->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'EXXON',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $gas->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'CHEVRON',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $gas->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'BP',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $gas->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'MOBIL',
                'logic_type' => 'or',
            ]);
        }

        // Entertainment - match entertainment keywords
        if ($entertainment) {
            TagCriteria::create([
                'tag_id' => $entertainment->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'NETFLIX',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $entertainment->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'SPOTIFY',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $entertainment->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'AMAZON PRIME',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $entertainment->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'DISNEY',
                'logic_type' => 'or',
            ]);
            TagCriteria::create([
                'tag_id' => $entertainment->id,
                'type' => 'description',
                'match_type' => 'contains',
                'value' => 'MOVIE',
                'logic_type' => 'or',
            ]);
        }

        $this->command->info('Demo tag criteria created successfully!');
        $this->command->info('Tags will now automatically apply to matching transactions using OR logic.');
    }
}
