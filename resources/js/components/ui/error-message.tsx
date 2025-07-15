import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
    error?: string | null;
    onDismiss?: () => void;
    className?: string;
    variant?: 'default' | 'destructive';
}

export function ErrorMessage({
    error,
    onDismiss,
    className,
    variant = 'destructive'
}: ErrorMessageProps) {
    if (!error) return null;

    return (
        <Alert className={cn("mb-4", className)} variant={variant}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                {onDismiss && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDismiss}
                        className="h-auto p-0 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
}

export function ConflictMessage({
    message,
    onResolve,
    resolveText = "Use Existing",
    className
}: {
    message: string;
    onResolve?: () => void;
    resolveText?: string;
    className?: string;
}) {
    return (
        <Alert className={cn("mb-4 border-yellow-200 bg-yellow-50 text-yellow-800", className)}>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="flex items-center justify-between">
                <span>{message}</span>
                {onResolve && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onResolve}
                        className="ml-2 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    >
                        {resolveText}
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
} 