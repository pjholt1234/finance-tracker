import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    FileText,
    Calendar,
    DollarSign,
    Users,
    Download,
    Trash2,
    BarChart3
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatDateTime } from '@/utils/date';

interface CsvSchema {
    id: number;
    name: string;
}

interface Transaction {
    id: number;
    date: string;
    balance: number; // Balance in pennies
    paid_in?: number; // Paid in amount in pennies
    paid_out?: number; // Paid out amount in pennies
    description?: string;
    reference?: string;
    created_at: string;
    updated_at: string;
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
    transactions: Transaction[];
}

interface ImportStats {
    total_rows: number;
    processed_rows: number;
    imported_rows: number;
    duplicate_rows: number;
    error_rows: number;
    success_rate: number;
}

interface Props {
    import: Import;
    stats: ImportStats;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Imports',
        href: '/imports',
    },
    {
        title: 'Import Results',
        href: '#',
    },
];

export default function ImportResults({ import: importData, stats }: Props) {
    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete this import and all ${importData.imported_rows} associated transactions?`)) {
            router.delete(route('transaction-imports.destroy', importData.id));
        }
    };

    const getStatusBadge = (status: Import['status']) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
            case 'failed':
                return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
            case 'processing':
                return <Badge variant="secondary">Processing</Badge>;
            case 'pending':
                return <Badge variant="outline">Pending</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatCurrency = (amount: number | undefined) => {
        if (!amount) return '-';

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(amount / 100);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Import Results - ${importData.filename}`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Page Heading */}
                <div>
                    <h1 className="text-3xl font-bold">
                        Import Results - <span className="text-muted-foreground">{importData.filename}</span>
                    </h1>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('transaction-imports.index')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Imports
                            </Button>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge(importData.status)}
                        {importData.status === 'completed' && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDelete}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Import
                            </Button>
                        )}
                    </div>
                </div>

                {/* Import Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Import Summary
                        </CardTitle>
                        <CardDescription>
                            Overview of the import process and results
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Total Rows</p>
                                <p className="text-2xl font-bold">{stats.total_rows}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Imported</p>
                                <p className="text-2xl font-bold text-green-600">{stats.imported_rows}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Duplicates</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.duplicate_rows}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Errors</p>
                                <p className="text-2xl font-bold text-red-600">{stats.error_rows}</p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span>Success Rate</span>
                                <span className="font-medium">{stats.success_rate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{ width: `${stats.success_rate}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">CSV Schema</p>
                                <p className="font-medium">{importData.csv_schema.name}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Import Date</p>
                                <p className="font-medium">{formatDateTime(importData.created_at)}</p>
                            </div>
                            {importData.started_at && (
                                <div>
                                    <p className="text-muted-foreground">Started</p>
                                    <p className="font-medium">{formatDateTime(importData.started_at)}</p>
                                </div>
                            )}
                            {importData.completed_at && (
                                <div>
                                    <p className="text-muted-foreground">Completed</p>
                                    <p className="font-medium">{formatDateTime(importData.completed_at)}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Error Message */}
                {importData.error_message && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Import Error:</strong> {importData.error_message}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Sample Transactions */}
                {importData.transactions.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Transactions
                            </CardTitle>
                            <CardDescription>
                                Preview of the latest imported transactions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {importData.transactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between p-4 border rounded-lg"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{formatDate(transaction.date)}</span>
                                            </div>
                                            {transaction.description && (
                                                <p className="text-sm text-muted-foreground">
                                                    {transaction.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right space-y-1">
                                            <div className="flex items-center gap-4">
                                                {transaction.paid_in && (
                                                    <div className="text-green-600 font-medium">
                                                        +{formatCurrency(transaction.paid_in)}
                                                    </div>
                                                )}
                                                {transaction.paid_out && (
                                                    <div className="text-red-600 font-medium">
                                                        -{formatCurrency(transaction.paid_out)}
                                                    </div>
                                                )}
                                                <div className="text-sm text-muted-foreground">
                                                    Balance: {formatCurrency(transaction.balance)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {importData.imported_rows > importData.transactions.length && (
                                <div className="mt-4 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {importData.transactions.length} of {importData.imported_rows} imported transactions
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="flex justify-center">
                    <Link href={route('transaction-imports.create')}>
                        <Button>
                            <FileText className="h-4 w-4 mr-2" />
                            Import More Transactions
                        </Button>
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
} 