import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { VALIDATION_MESSAGES } from '@/utils/constants';

export const useErrorHandler = () => {
    const { showToast } = useToast();

    const handleApiError = (error: unknown, fallbackMessage = VALIDATION_MESSAGES.UNEXPECTED_ERROR) => {
        if (error && typeof error === 'object' && 'message' in error) {
            const apiError = error as ApiError;

            if (apiError.isNetwork) {
                showToast(VALIDATION_MESSAGES.NETWORK_ERROR, 'error');
            } else if (apiError.isValidation) {
                showToast(apiError.message || VALIDATION_MESSAGES.VALIDATION_ERRORS, 'error');
            } else {
                showToast(apiError.message, 'error');
            }
        } else {
            showToast(fallbackMessage, 'error');
        }
    };

    const handleApiSuccess = (message: string) => {
        showToast(message, 'success');
    };

    return { handleApiError, handleApiSuccess };
};
