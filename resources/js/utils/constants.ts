/**
 * Application-wide constants
 */

// Color palette for tags and UI elements
export const TAG_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e'
] as const;

// Form validation messages
export const VALIDATION_MESSAGES = {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    TAG_NAME_REQUIRED: 'Please enter a tag name',
    VALIDATION_ERRORS: 'Please fix the validation errors below',
    TAG_CREATED_SUCCESS: 'Tag created successfully!',
    TAG_UPDATED_SUCCESS: 'Tag updated successfully!',
    FAILED_TO_LOAD: 'Failed to load data',
    NETWORK_ERROR: 'Network error occurred',
    UNEXPECTED_ERROR: 'An unexpected error occurred',
} as const;

// API endpoints
export const API_ENDPOINTS = {
    DASHBOARD: '/dashboard/api',
    TAG_SUGGESTIONS: '/api/tags/suggestions',
    TAG_CRITERIA: (tagId: number) => `/tags/${tagId}/criteria`,
    TAG_CRITERIA_WITH_ID: (tagId: number, criteriaId: number) => `/tags/${tagId}/criteria/${criteriaId}`,
} as const;

// Currency configuration
export const CURRENCY_CONFIG = {
    LOCALE: 'en-US',
    CURRENCY: 'USD',
    MINIMUM_FRACTION_DIGITS: 2,
} as const;
