# Use PHP 8.3 with Apache
FROM php:8.3-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    nodejs \
    npm \
    default-mysql-client \
    && docker-php-ext-install pdo_mysql pdo_sqlite mbstring exif pcntl bcmath gd zip \
    && pecl install redis && docker-php-ext-enable redis \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Enable Apache mod_rewrite and headers
RUN a2enmod rewrite headers

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy Apache configuration
COPY docker/apache/000-default.conf /etc/apache2/sites-available/000-default.conf

# Copy composer files first (for better Docker layer caching)
COPY composer.json composer.lock ./

# Set proper permissions for www-data user
RUN chown -R www-data:www-data /var/www \
    && chmod -R 755 /var/www

# Switch to www-data user for composer install
USER www-data

# Install composer dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy package files
COPY --chown=www-data:www-data package*.json ./

# Install npm dependencies and build assets
RUN npm ci --only=production \
    && npm run build \
    && rm -rf node_modules

# Copy application code
COPY --chown=www-data:www-data . .

# Create storage directories and set permissions
RUN mkdir -p storage/logs storage/framework/{cache,sessions,views} \
    && chmod -R 775 storage bootstrap/cache

# Switch back to root for final setup
USER root

# Add wait-for-it script for database connectivity
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /usr/local/bin/wait-for-it
RUN chmod +x /usr/local/bin/wait-for-it

# Create startup script
RUN echo '#!/bin/bash\n\
    # Wait for database if DB_HOST is set\n\
    if [ ! -z "$DB_HOST" ]; then\n\
    echo "Waiting for database at $DB_HOST:${DB_PORT:-3306}..."\n\
    /usr/local/bin/wait-for-it $DB_HOST:${DB_PORT:-3306} --timeout=60 --strict\n\
    fi\n\
    \n\
    # Start Apache\n\
    apache2-foreground' > /usr/local/bin/start.sh \
    && chmod +x /usr/local/bin/start.sh

# Expose port 80
EXPOSE 80

# Start Apache with database wait
CMD ["/usr/local/bin/start.sh"] 