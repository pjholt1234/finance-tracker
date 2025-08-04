# Demo User System Guide

## Overview

The Finance Tracker application includes a comprehensive demo user system that allows visitors to explore all features with realistic sample data without affecting production data.

## Demo User Access

- **Email**: `demo@financetracker.com`
- **Password**: `demo123`
- **Login**: Click the "Try Demo Account" button on the login page

## Interactive Demo Tour

When you first log in as a demo user, you'll be greeted with an interactive tour that highlights the key features of the application:

### Tour Features
- **Automatic Launch**: Tour starts automatically when you first land on the dashboard
- **Step-by-Step Guide**: Walks through all 6 main features with detailed explanations
- **Visual Highlights**: Sidebar menu items are highlighted as the tour progresses
- **Keyboard Navigation**: Use arrow keys to navigate, Escape to close
- **Manual Trigger**: Click "Start Tour" in the demo banner to restart the tour anytime

### Tour Steps
1. **Dashboard** - Your financial command center with overview charts and insights
2. **Accounts** - Manage multiple bank accounts and track balances
3. **Tags** - Smart transaction categorization with automatic tagging
4. **CSV Schemas** - Define custom formats for bank statement imports
5. **Imports** - View and manage your imported statement history
6. **Import Statement** - Upload and process bank statements with auto-categorization

### Tour Controls
- **Next/Previous**: Navigate through tour steps
- **Skip Tour**: Dismiss the tour and explore on your own
- **Keyboard Shortcuts**: Arrow keys for navigation, Escape to close
- **Progress Indicator**: Visual progress bar shows your position in the tour

## Demo Features

### 🔄 Auto-Reset System
- Demo data automatically resets every 24 hours
- Countdown timer shows time until next reset
- All changes are temporary and won't persist

### 📊 Sample Data Included

#### Accounts (3)
- **Checking Account**: $2,675.00 balance
- **Savings Account**: $15,482.00 balance  
- **Credit Card**: -$382.50 balance

#### Tags (6) with Auto-Tagging
- **Groceries** (green) - Auto-tags: SAFEWAY, TRADER JOE, WHOLE FOODS, KROGER, ALBERTSONS
- **Dining Out** (orange) - Auto-tags: RESTAURANT, PIZZA, COFFEE, STARBUCKS, MCDONALD, BURGER
- **Utilities** (blue) - Auto-tags: ELECTRIC, GAS COMPANY, WATER, INTERNET, CABLE
- **Salary** (teal) - Auto-tags: PAYROLL, SALARY, DEPOSIT
- **Gas** (red) - Auto-tags: SHELL, EXXON, CHEVRON, BP, MOBIL
- **Entertainment** (purple) - Auto-tags: NETFLIX, SPOTIFY, AMAZON PRIME, DISNEY, MOVIE

#### Transactions (16)
- Realistic transaction data across all accounts
- Mix of income, expenses, and transfers
- Pre-tagged with appropriate categories

#### CSV Schema
- **Name**: "Bank Statement Format"
- **Structure**: Date, Description, Paid In, Paid Out, Balance
- **Date Format**: Y-m-d (2025-08-01)

## Sample CSV Import File

A sample CSV file is provided: `demo-sample-transactions.csv`

### CSV Structure
```csv
Date,Description,Paid In,Paid Out,Balance
2025-08-01,PAYROLL DEPOSIT,3200.00,,5700.00
2025-08-02,SAFEWAY GROCERIES,,124.50,5575.50
2025-08-03,ELECTRIC BILL,,89.00,5486.50
...
```

### Auto-Tagging Examples
- `SAFEWAY GROCERIES` → **Groceries** tag
- `ELECTRIC BILL` → **Utilities** tag  
- `SHELL GAS STATION` → **Gas** tag
- `NETFLIX SUBSCRIPTION` → **Entertainment** tag

## Getting Started

1. **Login**: Click "Try Demo Account" on the login page
2. **Take the Tour**: The interactive tour will start automatically
3. **Explore Features**: Navigate through the sidebar to explore different sections
4. **Try Importing**: Download the sample CSV and try the import feature
5. **Experiment**: Make changes, create tags, and explore the interface
6. **Reset**: Data automatically resets every 24 hours

## Tips for Demo Users

- **Tour Navigation**: Use the tour to understand each feature before exploring
- **Sample Data**: All data is realistic and demonstrates real-world usage
- **Auto-Tagging**: See how the system automatically categorizes transactions
- **CSV Import**: Try importing the sample CSV to see the import process
- **Responsive Design**: Test the interface on different screen sizes
- **24-Hour Reset**: Don't worry about making changes - everything resets daily

## Demo Banner Features

The demo banner at the top of the page provides:
- **Tour Trigger**: Click "Start Tour" to restart the interactive tour
- **Sample CSV**: Download the sample CSV file for testing imports
- **Reset Timer**: See when the demo data will automatically reset
- **Demo Status**: Clear indication that you're in demo mode

## Management Commands

### Reset Demo Data
```bash
# Reset demo data if expired (24 hours)
php artisan demo:reset

# Force reset (even if not expired)
php artisan demo:reset --force

# Reset all demo users
php artisan demo:reset --all
```

### Recreate Demo User
```bash
# Clear and recreate demo user with fresh data
php artisan db:seed --class=DemoUserSeeder
```

## Security & Isolation

- Demo user is completely isolated from production data
- No access to real user accounts or data
- All changes are temporary and reset automatically
- Demo user cannot access admin functions

## Technical Implementation

### Database Schema
- `users.is_demo` - Boolean flag for demo users
- `users.demo_last_reset` - Timestamp of last reset
- Tag criteria for automatic transaction tagging

### Middleware
- `DemoUserNotification` - Adds demo context to Inertia
- Only applies to users with `is_demo = true`

### Components
- `DemoBanner` - Shows demo status and countdown
- Demo login button on authentication page

## Customization

### Adding More Tag Criteria
Edit `database/seeders/DemoUserSeeder.php` and add more criteria:

```php
TagCriteria::create([
    'tag_id' => $tag->id,
    'type' => 'description',
    'match_type' => 'contains',
    'value' => 'YOUR_KEYWORD',
]);
```

### Modifying Sample Data
- Edit transaction data in `DemoUserSeeder.php`
- Update CSV schema structure
- Modify account balances and descriptions

### Changing Reset Interval
Edit `app/Http/Controllers/Auth/DemoUserController.php`:

```php
// Change from 24 hours to desired interval
if (!$demoUser->demo_last_reset || $demoUser->demo_last_reset->diffInHours(now()) >= 24)
```

## Troubleshooting

### Demo User Not Working
1. Check if demo user exists: `php artisan tinker --execute="echo \App\Models\User::where('email', 'demo@financetracker.com')->exists();"`
2. Recreate demo user: `php artisan db:seed --class=DemoUserSeeder`

### CSV Import Issues
1. Verify CSV format matches schema
2. Check file encoding (should be UTF-8)
3. Ensure column headers match exactly

### Tag Criteria Not Working
1. Check tag criteria exist: `php artisan tinker --execute="echo \App\Models\TagCriteria::count();"`
2. Recreate criteria: `php artisan db:seed --class=DemoTagCriteriaSeeder`

## Best Practices

- **Regular resets** ensure fresh demo experience
- **Realistic data** helps users understand functionality
- **Auto-tagging** demonstrates smart categorization
- **Clear indicators** prevent confusion with real data
- **Comprehensive coverage** showcases all features 