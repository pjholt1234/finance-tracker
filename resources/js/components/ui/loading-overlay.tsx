import { LoaderCircle } from 'lucide-react';

interface LoadingOverlayProps {
    message?: string;
    className?: string;
}

export function LoadingOverlay({ message = "Loading...", className }: LoadingOverlayProps) {
    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm ${className || ''}`}>
            <div className="flex flex-col items-center space-y-4 text-white">
                <LoaderCircle className="h-8 w-8 animate-spin" />
                <p className="text-sm font-medium">{message}</p>
            </div>
        </div>
    );
} 