# Finance Tracker

A modern, full-stack personal finance management application built with Laravel, React, and TypeScript. Track your transactions, manage multiple accounts, and gain insights into your spending patterns with intelligent tagging and analytics.

## 🚀 Features

### 💰 Transaction Management
- **CSV Import**: Bulk import transactions from bank statements with customizable schemas
- **Smart Tagging**: Automatic tag suggestions based on transaction patterns
- **Manual Review**: Interactive transaction review with approve/discard workflow
- **Reference Tracking**: Add custom references and descriptions to transactions

### 🏦 Account Management
- **Multiple Accounts**: Manage multiple bank accounts in one place
- **Balance Tracking**: Automatic balance calculation and reconciliation
- **Account History**: View transaction history per account

### 🏷️ Intelligent Tagging System
- **Auto-Tagging**: Define criteria to automatically tag transactions
- **Smart Suggestions**: AI-powered tag suggestions based on transaction data
- **Criteria Builder**: Create complex tagging rules with AND/OR logic
- **Tag Categories**: Organize tags with colors and descriptions

### 📊 Analytics & Dashboard
- **Financial Overview**: Real-time balance and transaction summaries
- **Income/Expense Charts**: Visual breakdown of spending patterns
- **Tag Analytics**: See spending by category with interactive charts
- **Date Range Filtering**: Analyze data for specific time periods

### 🔐 Security & Authentication
- **Two-Factor Authentication**: Enhanced security with TOTP support
- **Email Verification**: Secure account creation process
- **Session Management**: Robust authentication with Laravel Fortify

## 🛠️ Technology Stack

### Backend
- **Laravel 12** - PHP framework for robust backend development
- **MySQL/PostgreSQL** - Reliable database storage
- **Laravel Fortify** - Authentication and security
- **Laravel Excel** - CSV import/export functionality
- **PHPUnit** - Comprehensive testing suite

### Frontend
- **React 19** - Modern UI library with hooks
- **TypeScript** - Type-safe JavaScript development
- **Inertia.js** - Seamless SPA experience without API complexity
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful, accessible component library
- **Recharts** - Interactive data visualization
- **Lucide React** - Beautiful icon library

### Development Tools
- **Vite** - Fast build tool and dev server
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **Laravel Pint** - PHP code style fixer


## 🧪 Testing

Run the test suite to ensure everything is working correctly:

```bash
# Run PHP tests
composer test

# Run frontend type checking
npm run types

# Run linting
npm run lint
```
