# Fix Mixed Content Error in Production

## Problem
Your application is getting a mixed content error because assets are being served over HTTP instead of HTTPS when accessed through your HTTPS domain.

## Solution
The issue has been fixed by:

1. **Adding TrustProxies middleware** in `bootstrap/app.php` to properly handle HTTPS when running behind a load balancer
2. **Adding ASSET_URL environment variable** to ensure assets are served over HTTPS

## Required Environment Variables for Production

Make sure your production environment has these variables set:

```bash
APP_URL=https://finance-tracker.pjholt.com
ASSET_URL=https://finance-tracker.pjholt.com
```

## For AWS ECS Deployment

Update your task definition in `deploy/task-definition.json` with the correct domain:

```json
{
    "name": "APP_URL",
    "value": "https://finance-tracker.pjholt.com"
},
{
    "name": "ASSET_URL", 
    "value": "https://finance-tracker.pjholt.com"
}
```

## For Other Deployment Methods

Add these environment variables to your production environment:

```bash
APP_URL=https://finance-tracker.pjholt.com
ASSET_URL=https://finance-tracker.pjholt.com
```

## What This Fixes

- **TrustProxies middleware**: Tells Laravel to trust the `X-Forwarded-*` headers from your load balancer, so it knows when requests are coming over HTTPS
- **ASSET_URL**: Explicitly tells Laravel to generate HTTPS URLs for assets (CSS, JS, images) instead of HTTP URLs

## After Deployment

1. Deploy the updated code with the TrustProxies middleware
2. Update your production environment variables
3. Clear any caches: `php artisan cache:clear && php artisan config:clear`
4. Restart your application

The mixed content error should be resolved after these changes. 