import { TAG_COLORS } from './constants';

/**
 * Generate a random color from the predefined palette
 */
export const generateRandomColor = (): string => {
    return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
};

/**
 * Build URL search parameters from a filters object
 * Handles arrays, dates, and empty values appropriately
 */
export const buildApiParams = (filters: Record<string, any>): URLSearchParams => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            if (Array.isArray(value) && value.length > 0) {
                params.append(key, value.join(','));
            } else if (value instanceof Date) {
                params.append(key, value.toISOString().split('T')[0]);
            } else {
                params.append(key, String(value));
            }
        }
    });
    
    return params;
};

/**
 * Format currency consistently across the application
 */
export const formatCurrency = (amount: number, locale = 'en-US', currency = 'USD'): string => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount / 100); // Convert from pennies to dollars
};
