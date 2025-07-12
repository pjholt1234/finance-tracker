import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Plus,
    FileText,
    MoreHorizontal,
    CheckCircle,
    AlertCircle,
    Clock,
    Calendar,
    Users,
    Eye,
    Trash2
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';

interface CsvSchema {
    id: number;
    name: string;
}

interface Import {
    id: number;
    filename: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    total_rows?: number;
    processed_rows: number;
    imported_rows: number;
    duplicate_rows: number;
    error_message?: string;
    started_at?: string;
    completed_at?: string;
    created_at: string;
    csv_schema: CsvSchema;
}

interface PaginationLink {
    url?: string;
    label: string;
    active: boolean;
}

interface PaginatedImports {
    data: Import[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Props {
    imports: PaginatedImports;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaction Imports',
        href: '/transaction-imports',
    },
];

export default function ImportHistory({ imports }: Props) {
    const handleDelete = (importData: Import) => {
        if (confirm(`Are you sure you want to delete the import "${importData.filename}" and all ${importData.imported_rows} associated transactions?`)) {
            router.delete(route('transaction-imports.destroy', importData.id));
        }
    };

    const getStatusBadge = (status: Import['status']) => {
        switch (status) {
            case 'completed':
                return (
                    <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                    </Badge>
                );
            case 'failed':
                return (
                    <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Failed
                    </Badge>
                );
            case 'processing':
                return (
                    <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Processing
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Import History" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Import History</h2>
                        <p className="text-muted-foreground mt-1">
                            View and manage your transaction import history
                        </p>
                    </div>
                    <Link href={route('transaction-imports.create')}>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Import Transactions
                        </Button>
                    </Link>
                </div>

                {imports.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No imports yet</h3>
                            <p className="text-muted-foreground text-center mb-6">
                                Start importing your transaction data from CSV files.
                            </p>
                            <Link href={route('transaction-imports.create')}>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Import Your First File
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {imports.data.map((importData) => (
                            <Card key={importData.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <h3 className="font-semibold">{importData.filename}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Schema: {importData.csv_schema.name}
                                                    </p>
                                                </div>
                                                {getStatusBadge(importData.status)}
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Imported</p>
                                                    <p className="font-medium text-green-600">
                                                        {importData.imported_rows} transactions
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Duplicates</p>
                                                    <p className="font-medium text-yellow-600">
                                                        {importData.duplicate_rows}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Created</p>
                                                    <p className="font-medium">
                                                        {formatDate(importData.created_at)}
                                                    </p>
                                                </div>
                                                {importData.completed_at && (
                                                    <div>
                                                        <p className="text-muted-foreground">Completed</p>
                                                        <p className="font-medium">
                                                            {formatDate(importData.completed_at)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {importData.error_message && (
                                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                    <p className="text-sm text-red-800">
                                                        <strong>Error:</strong> {importData.error_message}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="ml-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('transaction-imports.show', importData.id)}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {importData.status === 'completed' && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(importData)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete Import
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Pagination */}
                        {imports.last_page > 1 && (
                            <div className="flex justify-center mt-8">
                                <div className="flex items-center gap-2">
                                    {imports.links.map((link, index) => {
                                        if (!link.url) {
                                            return (
                                                <span
                                                    key={index}
                                                    className="px-3 py-2 text-sm text-muted-foreground"
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            );
                                        }

                                        return (
                                            <Link
                                                key={index}
                                                href={link.url}
                                                className={`px-3 py-2 text-sm rounded-md ${link.active
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'hover:bg-muted'
                                                    }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="text-center text-sm text-muted-foreground mt-4">
                            Showing {imports.data.length} of {imports.total} imports
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
} 