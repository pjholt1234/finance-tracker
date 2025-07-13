/**
 * Format a date string to d/m/Y format
 * @param dateString - ISO date string (Y-m-d) or Date object
 * @returns formatted date string in d/m/Y format
 */
export function formatDate(dateString: string | Date): string {
    if (!dateString) return '';

    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    // Check if date is valid
    if (isNaN(date.getTime())) return '';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

/**
 * Format a date string to a localized date string
 * @param dateString - ISO date string (Y-m-d) or Date object
 * @returns formatted date string using browser locale
 */
export function formatDateLocalized(dateString: string | Date): string {
    if (!dateString) return '';

    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    // Check if date is valid
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString();
}

/**
 * Format a date string to a localized datetime string
 * @param dateString - ISO date string or Date object
 * @returns formatted datetime string using browser locale
 */
export function formatDateTime(dateString: string | Date): string {
    if (!dateString) return '';

    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    // Check if date is valid
    if (isNaN(date.getTime())) return '';

    return date.toLocaleString();
}

/**
 * Parse a date string and return a Date object
 * @param dateString - date string in various formats
 * @returns Date object or null if invalid
 */
export function parseDate(dateString: string): Date | null {
    if (!dateString) return null;

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) return null;

    return date;
} 