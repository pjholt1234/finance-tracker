<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\CsvSchema;
use App\Models\Tag;
use App\Models\TagCriteria;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create demo user
        $demoUser = User::updateOrCreate(
            ['email' => 'demo@financetracker.com'],
            [
                'name' => 'Demo User',
                'email' => 'demo@financetracker.com',
                'password' => Hash::make('demo123'),
                'email_verified_at' => now(),
                'is_demo' => true,
                'demo_last_reset' => now(),
            ]
        );

        // Clear existing demo data
        $demoUser->accounts()->delete();
        $demoUser->tags()->delete();
        $demoUser->csvSchemas()->delete();
        $demoUser->transactions()->delete();

        // Create sample accounts
        $checkingAccount = Account::create([
            'user_id' => $demoUser->id,
            'name' => 'Checking Account',
            'number' => 12345678,
            'sort_code' => '12-34-56',
            'description' => 'Primary checking account for daily expenses',
            'balance_at_start' => 250000, // $2,500.00
            'balance' => 267500, // $2,675.00
        ]);

        $savingsAccount = Account::create([
            'user_id' => $demoUser->id,
            'name' => 'Savings Account',
            'number' => 87654321,
            'sort_code' => '12-34-56',
            'description' => 'High-yield savings account',
            'balance_at_start' => 1500000, // $15,000.00
            'balance' => 1548200, // $15,482.00
        ]);

        $creditCard = Account::create([
            'user_id' => $demoUser->id,
            'name' => 'Credit Card',
            'number' => 11111111,
            'sort_code' => '98-76-54',
            'description' => 'Cashback credit card',
            'balance_at_start' => -45000, // -$450.00
            'balance' => -38250, // -$382.50
        ]);

        // Create sample tags
        $groceries = Tag::create([
            'user_id' => $demoUser->id,
            'name' => 'Groceries',
            'color' => '#22c55e',
        ]);

        $dining = Tag::create([
            'user_id' => $demoUser->id,
            'name' => 'Dining Out',
            'color' => '#f59e0b',
        ]);

        $utilities = Tag::create([
            'user_id' => $demoUser->id,
            'name' => 'Utilities',
            'color' => '#3b82f6',
        ]);

        $salary = Tag::create([
            'user_id' => $demoUser->id,
            'name' => 'Salary',
            'color' => '#10b981',
        ]);

        $gas = Tag::create([
            'user_id' => $demoUser->id,
            'name' => 'Gas',
            'color' => '#ef4444',
        ]);

        $entertainment = Tag::create([
            'user_id' => $demoUser->id,
            'name' => 'Entertainment',
            'color' => '#8b5cf6',
        ]);

        // Create tag criteria for automatic tagging
        $this->createTagCriteria($groceries, $dining, $utilities, $salary, $gas, $entertainment);

        // Create sample transactions
        $transactions = [
            // Checking Account transactions
            [
                'account_id' => $checkingAccount->id,
                'date' => now()->subDays(30),
                'description' => 'Payroll Deposit',
                'paid_in' => 320000, // $3,200.00
                'paid_out' => null,
                'balance' => 570000,
                'tags' => [$salary->id],
            ],
            [
                'account_id' => $checkingAccount->id,
                'date' => now()->subDays(28),
                'description' => 'Whole Foods Market',
                'paid_in' => null,
                'paid_out' => 12450, // $124.50
                'balance' => 557550,
                'tags' => [$groceries->id],
            ],
            [
                'account_id' => $checkingAccount->id,
                'date' => now()->subDays(27),
                'description' => 'Electric Bill',
                'paid_in' => null,
                'paid_out' => 8900, // $89.00
                'balance' => 548650,
                'tags' => [$utilities->id],
            ],
            [
                'account_id' => $checkingAccount->id,
                'date' => now()->subDays(25),
                'description' => 'Shell Gas Station',
                'paid_in' => null,
                'paid_out' => 5250, // $52.50
                'balance' => 543400,
                'tags' => [$gas->id],
            ],
            [
                'account_id' => $checkingAccount->id,
                'date' => now()->subDays(23),
                'description' => 'Netflix Subscription',
                'paid_in' => null,
                'paid_out' => 1599, // $15.99
                'balance' => 541801,
                'tags' => [$entertainment->id],
            ],
            [
                'account_id' => $checkingAccount->id,
                'date' => now()->subDays(20),
                'description' => 'Transfer to Savings',
                'paid_in' => null,
                'paid_out' => 50000, // $500.00
                'balance' => 491801,
                'tags' => [],
            ],
            [
                'account_id' => $checkingAccount->id,
                'date' => now()->subDays(18),
                'description' => 'Trader Joes',
                'paid_in' => null,
                'paid_out' => 8775, // $87.75
                'balance' => 483026,
                'tags' => [$groceries->id],
            ],
            [
                'account_id' => $checkingAccount->id,
                'date' => now()->subDays(15),
                'description' => 'Pizza Palace',
                'paid_in' => null,
                'paid_out' => 2850, // $28.50
                'balance' => 480176,
                'tags' => [$dining->id],
            ],
            [
                'account_id' => $checkingAccount->id,
                'date' => now()->subDays(10),
                'description' => 'ATM Withdrawal',
                'paid_in' => null,
                'paid_out' => 10000, // $100.00
                'balance' => 470176,
                'tags' => [],
            ],
            [
                'account_id' => $checkingAccount->id,
                'date' => now()->subDays(5),
                'description' => 'Safeway',
                'paid_in' => null,
                'paid_out' => 9525, // $95.25
                'balance' => 460651,
                'tags' => [$groceries->id],
            ],
            [
                'account_id' => $checkingAccount->id,
                'date' => now()->subDays(2),
                'description' => 'Online Transfer',
                'paid_in' => 6849, // $68.49 (refund)
                'paid_out' => null,
                'balance' => 267500,
                'tags' => [],
            ],

            // Savings Account transactions
            [
                'account_id' => $savingsAccount->id,
                'date' => now()->subDays(20),
                'description' => 'Transfer from Checking',
                'paid_in' => 50000, // $500.00
                'paid_out' => null,
                'balance' => 1550000,
                'tags' => [],
            ],
            [
                'account_id' => $savingsAccount->id,
                'date' => now()->subDays(1),
                'description' => 'Interest Payment',
                'paid_in' => 1800, // $18.00
                'paid_out' => null,
                'balance' => 1548200,
                'tags' => [],
            ],

            // Credit Card transactions
            [
                'account_id' => $creditCard->id,
                'date' => now()->subDays(25),
                'description' => 'Amazon Purchase',
                'paid_in' => null,
                'paid_out' => 8999, // $89.99
                'balance' => -54999,
                'tags' => [],
            ],
            [
                'account_id' => $creditCard->id,
                'date' => now()->subDays(20),
                'description' => 'Coffee Shop',
                'paid_in' => null,
                'paid_out' => 550, // $5.50
                'balance' => -55549,
                'tags' => [$dining->id],
            ],
            [
                'account_id' => $creditCard->id,
                'date' => now()->subDays(15),
                'description' => 'Gas Station',
                'paid_in' => null,
                'paid_out' => 4200, // $42.00
                'balance' => -59749,
                'tags' => [$gas->id],
            ],
            [
                'account_id' => $creditCard->id,
                'date' => now()->subDays(10),
                'description' => 'Payment Received',
                'paid_in' => 21499, // $214.99
                'paid_out' => null,
                'balance' => -38250,
                'tags' => [],
            ],
        ];

        foreach ($transactions as $transactionData) {
            $tags = $transactionData['tags'];
            unset($transactionData['tags']);

            $transactionData['user_id'] = $demoUser->id;
            $transactionData['import_id'] = 'demo-seed-'.now()->timestamp;
            $transactionData['unique_hash'] = Transaction::generateUniqueHash(
                $transactionData['user_id'],
                $transactionData['date']->format('Y-m-d'),
                $transactionData['balance'],
                $transactionData['paid_in'],
                $transactionData['paid_out']
            );

            $transaction = Transaction::create($transactionData);

            // Attach tags
            if (! empty($tags)) {
                $transaction->tags()->attach($tags, [
                    'is_recommended' => false,
                    'is_user_added' => true,
                ]);
            }
        }

        // Create sample CSV schema
        CsvSchema::create([
            'user_id' => $demoUser->id,
            'name' => 'Bank Statement Format',
            'transaction_data_start' => 2,
            'date_column' => 1,
            'description_column' => 2,
            'paid_in_column' => 3,
            'paid_out_column' => 4,
            'balance_column' => 5,
            'date_format' => 'Y-m-d',
        ]);

        $this->command->info('Demo user created with sample data!');
        $this->command->info('Email: demo@financetracker.com');
        $this->command->info('Password: demo123');
        $this->command->info('Sample CSV file: demo-sample-transactions.csv');
    }

    /**
     * Create tag criteria for automatic tagging.
     */
    private function createTagCriteria($groceries, $dining, $utilities, $salary, $gas, $entertainment): void
    {
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
    }
}
