import { ReactNode } from 'react';

interface CardGridProps<T> {
    items: T[];
    renderItem: (item: T) => ReactNode;
    columns?: {
        sm?: number;
        md?: number;
        lg?: number;
    };
    className?: string;
}

export const CardGrid = <T,>({
    items,
    renderItem,
    columns = { sm: 1, md: 2, lg: 3 },
    className = ""
}: CardGridProps<T>) => {
    const gridClasses = `grid gap-4 sm:grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} ${className}`;

    return (
        <div className={gridClasses}>
            {items.map(renderItem)}
        </div>
    );
}; 