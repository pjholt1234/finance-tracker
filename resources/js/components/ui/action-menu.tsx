import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface ActionItem {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href?: string;
    onClick?: () => void;
    variant?: 'default' | 'destructive';
}

interface ActionMenuProps {
    actions: ActionItem[];
}

export const ActionMenu = ({ actions }: ActionMenuProps) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {actions.map((action, index) => (
                    <DropdownMenuItem
                        key={index}
                        asChild={!!action.href}
                        onClick={action.onClick}
                        className={action.variant === 'destructive' ? 'text-destructive' : ''}
                    >
                        {action.href ? (
                            <Link href={action.href}>
                                <action.icon className="mr-2 h-4 w-4" />
                                {action.label}
                            </Link>
                        ) : (
                            <>
                                <action.icon className="mr-2 h-4 w-4" />
                                {action.label}
                            </>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}; 