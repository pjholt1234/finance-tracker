import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface SortableTableProps<T> {
    data: T[];
    columns: {
        key: keyof T;
        label: string;
        sortable?: boolean;
        render?: (value: any, row: T) => React.ReactNode;
    }[];
    defaultSort?: {
        key: keyof T;
        direction: 'asc' | 'desc';
    };
}

export function SortableTable<T>({ data, columns, defaultSort }: SortableTableProps<T>) {
    const [sortConfig, setSortConfig] = useState(defaultSort || { key: columns[0].key, direction: 'asc' as const });

    const handleSort = (key: keyof T) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const sortedData = [...data].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
        } else {
            comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    const getSortIcon = (key: keyof T) => {
        if (sortConfig.key !== key) {
            return <ArrowUpDown className="h-4 w-4" />;
        }
        return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    };

    return (
        <div className="overflow-hidden rounded-lg border">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={String(column.key)}
                                    className={`px-3 py-2 text-left font-medium ${column.sortable !== false ? 'cursor-pointer hover:bg-muted/80' : ''
                                        }`}
                                    onClick={() => column.sortable !== false && handleSort(column.key)}
                                >
                                    <div className="flex items-center gap-1">
                                        {column.label}
                                        {column.sortable !== false && getSortIcon(column.key)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-t">
                                {columns.map((column) => (
                                    <td key={String(column.key)} className="px-3 py-2">
                                        {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
} 