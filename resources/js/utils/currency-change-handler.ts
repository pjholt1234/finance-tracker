import { ChangeEvent } from 'react';

/**
 * Handle currency input changes and convert to pennies
 */
export const handleCurrencyChange = (e: ChangeEvent<HTMLInputElement>, setData: (key: string, value: number) => void, formKey: string): void => {
    const value = e.target.value;
    if (value === '') {
        setData(formKey, 0);
    } else {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            setData(formKey, Math.round(numValue * 100));
        }
    }
};

// Keep the default export for backwards compatibility
export default handleCurrencyChange;
