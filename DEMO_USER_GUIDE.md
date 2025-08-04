# Demo User System Guide

## Overview

The Finance Tracker application includes a comprehensive demo user system that allows visitors to explore all features with realistic sample data without affecting production data.

## Demo User Access

- **Email**: `demo@financetracker.com`
- **Password**: `demo123`
- **Login**: Click the "Try Demo Account" button on the login page

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
- `PAYROLL DEPOSIT` → **Salary** tag
- `PIZZA PALACE RESTAURANT` → **Dining Out** tag

## How to Test CSV Import

1. **Login as demo user**
2. **Go to "Import Statement"** page
3. **Upload** `demo-sample-transactions.csv`
4. **Select** "Bank Statement Format" schema
5. **Preview** the import - transactions will be auto-tagged
6. **Finalize** the import to see tagged transactions

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

## Demo Banner Features

- **Orange banner** clearly indicates demo mode
- **Countdown timer** shows time until reset
- **Information text** explains demo limitations
- **Expired state** shows when data needs refresh

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