import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    action?: {
        href: string;
        label: string;
        icon: React.ComponentType<{ className?: string }>;
    };
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
                <Icon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground text-center mb-4">{description}</p>
                {action && (
                    <Button asChild>
                        <Link href={action.href}>
                            <action.icon className="mr-2 h-4 w-4" />
                            {action.label}
                        </Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}; 