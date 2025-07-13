import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
    title: string;
    description: string;
    action?: {
        href: string;
        label: string;
        icon: React.ComponentType<{ className?: string }>;
    };
}

export const PageHeader = ({ title, description, action }: PageHeaderProps) => {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                <p className="text-muted-foreground">{description}</p>
            </div>
            {action && (
                <Button asChild>
                    <Link href={action.href}>
                        <action.icon className="mr-2 h-4 w-4" />
                        {action.label}
                    </Link>
                </Button>
            )}
        </div>
    );
}; 