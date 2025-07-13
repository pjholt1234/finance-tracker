import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    Plus,
    FileText,
    Calendar,
    DollarSign,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    CheckCircle,
    AlertCircle,
    Clock,
    Upload
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatDateTime } from '@/utils/date';

interface CsvSchema {
    id: number;
    name: string;
}

interface Import {
    id: number;
    filename: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    total_rows: number;
    processed_rows: number;
    imported_rows: number;
    duplicate_rows: number;
    error_message?: string;
    started_at?: string;
    completed_at?: string;
    created_at: string;
    csv_schema: CsvSchema;
}

interface Props {
    imports: {
        data: Import[];
        links: any[];
        meta: any;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Imports',
        href: '/imports',
    },
];

export default function ImportHistory({ imports }: Props) {
    if (!imports || !Array.isArray(imports.data)) {
        return (
            <AppLayout>
                <Head title="Import History" />
                <div className="p-8 text-red-600">Error: imports data is missing or invalid.</div>
            </AppLayout>
        );
    }

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Import History" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Import History</h1>
                        <p className="text-muted-foreground">
                            View and manage your transaction imports
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={route('transaction-imports.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Import Transactions
                        </Link>
                    </Button>
                </div>

                {/* Import Cards */}
                {(imports.data || []).length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No imports yet</h3>
                            <p className="text-muted-foreground text-center mb-6">
                                Get started by importing your first CSV file of transactions.
                            </p>
                            <Button asChild>
                                <Link href={route('transaction-imports.create')}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import Transactions
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {(imports.data || []).map((importData) => (
                            <Card key={importData.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-3">
                                                <CardTitle className="text-lg">{importData.filename}</CardTitle>
                                                {getStatusBadge(importData.status)}
                                            </div>
                                            <CardDescription>
                                                Schema: {importData.csv_schema.name}
                                            </CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={route('transaction-imports.show', importData.id)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                {importData.status === 'completed' && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(importData)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Import
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0">
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
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {(imports.links && Array.isArray(imports.links) && imports.links.length > 3) && (
                    <div className="flex items-center justify-center space-x-2">
                        {(imports.links || []).map((link: any, index: number) => (
                            <Button
                                key={index}
                                variant={link.active ? "default" : "outline"}
                                size="sm"
                                asChild={!!link.url}
                                disabled={!link.url}
                            >
                                {link.url ? (
                                    <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                )}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
} 