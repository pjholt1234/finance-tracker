# Use official PHP Apache image with pre-installed extensions
FROM php:8.3-apache

# Install system dependencies and PHP extensions in one layer
RUN apt-get update && apt-get install -y \
    git curl zip unzip \
    libpng-dev libjpeg-dev libfreetype6-dev \
    libzip-dev libonig-dev \
    default-mysql-client \
    netcat-openbsd \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && a2enmod rewrite headers \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy Apache config
COPY docker/apache/000-default.conf /etc/apache2/sites-available/000-default.conf

# Copy application first
COPY . .

# Install dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction
RUN npm ci --only=production && npm run build && rm -rf node_modules

# Set permissions
RUN chown -R www-data:www-data /var/www \
    && chmod -R 775 storage bootstrap/cache

# Create startup script with database migration
RUN echo '#!/bin/bash\n\
    echo "🚀 Starting Finance Tracker..."\n\
    \n\
    # Wait for database if DB_HOST is set\n\
    if [ ! -z "$DB_HOST" ]; then\n\
    echo "⏳ Waiting for database at $DB_HOST:${DB_PORT:-3306}..."\n\
    timeout 60 bash -c "until nc -z $DB_HOST ${DB_PORT:-3306}; do sleep 1; done"\n\
    if [ $? -eq 0 ]; then\n\
    echo "✅ Database is ready!"\n\
    \n\
    # TEMPORARY: Run fresh migrations with corrected schema\n\
    echo "🔥 Running FRESH database migrations (corrected schema)..."\n\
    php artisan migrate:fresh --force\n\
    \n\
    if [ $? -eq 0 ]; then\n\
    echo "✅ Fresh migrations completed successfully!"\n\
    else\n\
    echo "❌ Fresh migration failed, but continuing..."\n\
    fi\n\
    else\n\
    echo "⚠️ Database connection timeout, but continuing..."\n\
    fi\n\
    fi\n\
    \n\
    echo "🌐 Starting Apache..."\n\
    apache2-foreground' > /usr/local/bin/start.sh \
    && chmod +x /usr/local/bin/start.sh

# Simple startup
EXPOSE 80
CMD ["/usr/local/bin/start.sh"] 