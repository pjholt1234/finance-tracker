# 🗄️ Migrating from SQLite to MySQL

## Overview
We're migrating from SQLite (file-based) to Amazon RDS MySQL for better production reliability, scalability, and concurrent access handling.

## ✅ What's Already Done

### 1. RDS Database Created
- **Instance**: `finance-tracker-db`
- **Engine**: MySQL (latest)
- **Size**: db.t3.micro (Free Tier)
- **Storage**: 20GB
- **Username**: `admin`
- **Password**: `FinanceTracker2024`
- **Database**: `finance_tracker`
- **Region**: eu-west-2 (London)

### 2. Application Updated
- ✅ `.env.docker` updated for MySQL
- ✅ Dockerfile updated with MySQL client
- ✅ GitHub Actions updated for RDS deployment
- ✅ Database credentials stored in AWS SSM Parameter Store

## 🚀 Deployment Process

### When you push to main branch:

1. **GitHub Actions will:**
   - Build new Docker image with MySQL support
   - Get RDS endpoint automatically
   - Store database credentials securely in AWS SSM
   - Deploy to Fargate with MySQL configuration
   - Run `php artisan migrate --force` to create tables

### First Deployment:
- All Laravel tables will be created fresh in MySQL
- No existing data will be migrated (fresh start)

## 🔧 Manual Data Migration (Optional)

If you want to migrate existing SQLite data:

### Option 1: Export/Import via Laravel
```bash
# Export from SQLite (local)
php artisan tinker
>>> DB::table('users')->get()->toJson();

# Import to MySQL (production)
# Use the ECS execute-command to run artisan tinker on production
```

### Option 2: Database Dump Tools
```bash
# Export SQLite to SQL
sqlite3 database/database.sqlite .dump > sqlite_export.sql

# Import to MySQL (modify syntax for MySQL compatibility)
mysql -h [RDS_ENDPOINT] -u admin -p finance_tracker < mysql_import.sql
```

## 🔍 Verify Migration

### Check RDS Status:
```bash
aws rds describe-db-instances --db-instance-identifier finance-tracker-db --query 'DBInstances[0].{Status:DBInstanceStatus,Endpoint:Endpoint.Address}'
```

### Test Connection:
```bash
mysql -h [RDS_ENDPOINT] -u admin -p finance_tracker
```

### Check Tables After Deployment:
```bash
# Via ECS execute-command
aws ecs execute-command \
  --cluster finance-tracker-cluster \
  --task [TASK_ARN] \
  --container finance-tracker \
  --interactive \
  --command "php artisan tinker"

# Then in tinker:
>>> Schema::hasTable('users');
>>> DB::table('users')->count();
```

## 🎯 Next Steps

1. **Push to main** to trigger MySQL deployment
2. **Verify deployment** succeeds
3. **Test application** functionality
4. **Run fresh migrations** for clean start
5. **Optional**: Migrate existing data if needed

## 🔒 Security Notes

- Database is in private subnets (not publicly accessible)
- Credentials stored securely in AWS SSM Parameter Store
- Security group allows access only from ECS tasks
- Encrypted at rest with AWS managed keys

## 💰 Cost Impact

- **RDS db.t3.micro**: ~$13/month (Free Tier eligible for 12 months)
- **Storage**: 20GB included in Free Tier
- **Backup**: 7-day retention included 