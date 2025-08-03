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
- **Smart Suggestions**: Tag suggestions based on transaction data
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

## ☁️ Infrastructure

### Production (AWS)
- **AWS Fargate** - Serverless container platform for running the application
- **AWS RDS MySQL** - Managed MySQL database
- **GitHub Actions CI/CD** - Automated testing and manual deployment pipeline
- **AWS ECR** - Container registry for Docker images
- **AWS Systems Manager** - Parameter Store for secure configuration management
- **CloudWatch Logs** - Application logging and monitoring

### Development (Local)
- **Docker Compose** - Local development environment
- **MySQL** - Local database for development
- **Redis** - Caching and session storage
- **MailHog** - Email testing and development
- **Vite** - Development server with hot reloading

### Key Features
- **Automated Testing**: Runs comprehensive test suite on every push
- **Code Quality**: Automated linting and formatting checks
- **Manual Deployment**: Controlled production deployments via workflow dispatch
- **Environment Management**: Separate environments for development and production
- **Security**: Secrets management for sensitive configuration

## 🚀 Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub Repo   │    │  GitHub Actions │    │   AWS ECR       │
│                 │───▶│   CI/CD Pipeline│───▶│   Container     │
│                 │    │                 │    │   Registry      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   AWS Fargate   │    │   AWS RDS       │
                       │   ECS Service   │    │   MySQL         │
                       │                 │    │   Database      │
                       └─────────────────┘    └─────────────────┘
                                │                        │
                                └────────────┬───────────┘
                                             ▼
                                    ┌─────────────────┐
                                    │   Application   │
                                    │   Load Balancer │
                                    └─────────────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │   Production    │
                                    │   Application   │
                                    └─────────────────┘
```

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

## 🚀 Development Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ and npm
- PHP 8.3+

### Local Development
```bash
# Clone the repository
git clone <repository-url>
cd finance-tracker

# Start the development environment
docker compose -f docker-compose.dev.yml up -d

# Install dependencies
docker compose -f docker-compose.dev.yml exec app composer install
docker compose -f docker-compose.dev.yml exec app npm install

# Run migrations
docker compose -f docker-compose.dev.yml exec app php artisan migrate

# Build assets
docker compose -f docker-compose.dev.yml exec app npm run build

# Access the application
open http://localhost:8000
```

### Production Deployment
1. **Manual Deployment**: Go to GitHub Actions → "Deploy to AWS Fargate" → "Run workflow"
2. **Environment Variables**: Configured via AWS Systems Manager Parameter Store
3. **Database Migrations**: Run automatically on container startup
4. **Health Checks**: Application health monitored by ECS

## 🔧 Configuration

### Environment Variables
- `APP_ENV`: Application environment (local, production)
- `APP_URL`: Application URL for asset generation
- `ASSET_URL`: Asset URL for HTTPS mixed content prevention
- `DB_CONNECTION`: Database connection type
- `DB_HOST`: Database host (from RDS)
- `DB_DATABASE`: Database name
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password (from SSM)
