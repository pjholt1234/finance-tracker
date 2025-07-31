import { useCallback } from 'react';

export const useCurrencyFormat = () => {
    const formatCurrency = useCallback((amount: number | undefined) => {
        if (!amount) return '-';

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(amount / 100);
    }, []);

    return { formatCurrency };
};
