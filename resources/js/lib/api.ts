/**
 * Standardized API client for the application
 * Uses fetch with proper CSRF handling and Inertia-compatible headers
 */

interface ApiOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
    signal?: AbortSignal;
}

interface ApiResponse<T = any> {
    data: T;
    status: number;
    ok: boolean;
}

interface ApiError {
    status: number;
    message: string;
    errors?: Record<string, string[]>;
    isConflict?: boolean;
    isValidation?: boolean;
    isServer?: boolean;
    isNetwork?: boolean;
}

class ApiClient {
    private baseURL: string;

    constructor() {
        this.baseURL = '';
    }

    private getCsrfToken(): string {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        if (!token) {
            console.warn('CSRF token not found in meta tag. Check if the token is properly set in the HTML head.');
        }

        return token || '';
    }

    private getDefaultHeaders(): Record<string, string> {
        const csrfToken = this.getCsrfToken();

        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken,
        };
    }

    private createApiError(status: number, data: any, isNetwork = false): ApiError {
        const error: ApiError = {
            status,
            message: data?.message || 'An unexpected error occurred',
            errors: data?.errors,
            isConflict: status === 409,
            isValidation: status === 422,
            isServer: status >= 500,
            isNetwork,
        };

        return error;
    }

    private async request<T = any>(url: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
        const {
            method = 'GET',
            headers = {},
            body,
            signal,
        } = options;

        const config: RequestInit = {
            method,
            headers: {
                ...this.getDefaultHeaders(),
                ...headers,
            },
            credentials: 'same-origin',
            signal,
        };

        if (body && method !== 'GET') {
            config.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const error = this.createApiError(response.status, data);
                throw error;
            }

            return {
                data,
                status: response.status,
                ok: response.ok,
            };
        } catch (error) {
            if (error instanceof TypeError) {
                // Network error
                throw this.createApiError(0, { message: 'Network error occurred' }, true);
            }
            throw error;
        }
    }

    async get<T = any>(url: string, options?: Omit<ApiOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
        return this.request<T>(url, { ...options, method: 'GET' });
    }

    async post<T = any>(url: string, data?: any, options?: Omit<ApiOptions, 'method'>): Promise<ApiResponse<T>> {
        return this.request<T>(url, { ...options, method: 'POST', body: data });
    }

    async put<T = any>(url: string, data?: any, options?: Omit<ApiOptions, 'method'>): Promise<ApiResponse<T>> {
        return this.request<T>(url, { ...options, method: 'PUT', body: data });
    }

    async patch<T = any>(url: string, data?: any, options?: Omit<ApiOptions, 'method'>): Promise<ApiResponse<T>> {
        return this.request<T>(url, { ...options, method: 'PATCH', body: data });
    }

    async delete<T = any>(url: string, options?: Omit<ApiOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
        return this.request<T>(url, { ...options, method: 'DELETE' });
    }
}

// Export a singleton instance
export const api = new ApiClient();

// Export the class for testing or custom instances
export { ApiClient };
export type { ApiError, ApiResponse };
