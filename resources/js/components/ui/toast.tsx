import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: Toast['type'], duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

interface ToastProviderProps {
    children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: Toast['type'] = 'info', duration: number = 5000) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: Toast = { id, message, type, duration };

        setToasts(prev => [...prev, newToast]);

        // Auto-dismiss after duration
        if (duration > 0) {
            setTimeout(() => {
                dismissToast(id);
            }, duration);
        }
    };

    const dismissToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    );
}

interface ToastContainerProps {
    toasts: Toast[];
    onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

interface ToastItemProps {
    toast: Toast;
    onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return <CheckCircle className="h-4 w-4" />;
            case 'error':
                return <AlertCircle className="h-4 w-4" />;
            default:
                return <Info className="h-4 w-4" />;
        }
    };

    const getStyles = () => {
        switch (toast.type) {
            case 'success':
                return 'bg-green-100 border-green-300 text-green-900 dark:bg-green-900 dark:border-green-700 dark:text-green-100';
            case 'error':
                return 'bg-red-100 border-red-300 text-red-900 dark:bg-red-900 dark:border-red-700 dark:text-red-100';
            default:
                return 'bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100';
        }
    };

    return (
        <div
            className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 ease-in-out',
                getStyles(),
                isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
            )}
        >
            {getIcon()}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
                onClick={() => onDismiss(toast.id)}
                className="ml-auto p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    );
} 