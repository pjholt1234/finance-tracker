import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { useCurrencyFormat } from '@/hooks';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Account, Import } from '@/types/global';
import { formatDate, formatDateTime } from '@/utils/date';
import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Calculator, CheckCircle, Clock, DollarSign, Edit, FileText, Hash, MoreHorizontal, Upload } from 'lucide-react';

interface Props {
    account: Account;
}

const breadcrumbs = (account: Account): BreadcrumbItem[] => [
    {
        title: 'Accounts',
        href: '/accounts',
    },
    {
        title: account.name,
        href: `/accounts/${account.id}`,
    },
];

export default function AccountShow({ account }: Props) {
    const { formatCurrency } = useCurrencyFormat();
    const handleRecalculateBalance = () => {
        router.post(route('accounts.recalculate-balance', account.id));
    };

    const getStatusBadge = (status: Import['status']) => {
        switch (status) {
            case 'completed':
                return (
                    <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Completed
                    </Badge>
                );
            case 'failed':
                return (
                    <Badge variant="destructive">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Failed
                    </Badge>
                );
            case 'processing':
                return (
                    <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        Processing
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(account)}>
            <Head title={account.name} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={route('accounts.index')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{account.name}</h1>
                            <p className="text-muted-foreground">
                                Account {account.number} • {account.sort_code}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button asChild>
                            <Link href={route('transaction-imports.create')}>
                                <Upload className="mr-2 h-4 w-4" />
                                Import Transactions
                            </Link>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={route('accounts.edit', account.id)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Account
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleRecalculateBalance}>
                                    <Calculator className="mr-2 h-4 w-4" />
                                    Recalculate Balance
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(account.balance)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Starting Balance</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(account.balance_at_start)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Imports</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{account.imports?.length || 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                            <Hash className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{account.total_transaction_count || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Transactions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                            <CardDescription>Latest transactions for this account</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {account.transactions?.length === 0 ? (
                                <div className="py-8 text-center">
                                    <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                    <h3 className="mb-2 text-lg font-semibold">No transactions yet</h3>
                                    <p className="mb-4 text-muted-foreground">Import your first CSV file to see transactions here.</p>
                                    <Button asChild>
                                        <Link href={route('transaction-imports.create')}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Import Transactions
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {account.transactions?.map((transaction) => (
                                        <div key={transaction.id} className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">{transaction.description || 'No description'}</p>
                                                <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <div className="flex items-center gap-4">
                                                    {transaction.paid_in && (
                                                        <div className="font-medium text-green-600">+{formatCurrency(transaction.paid_in)}</div>
                                                    )}
                                                    {transaction.paid_out && (
                                                        <div className="font-medium text-red-600">-{formatCurrency(transaction.paid_out)}</div>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">Balance: {formatCurrency(transaction.balance)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Import History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Import History</CardTitle>
                            <CardDescription>Recent imports for this account</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {account.imports?.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                    <h3 className="mb-2 text-lg font-semibold">No imports yet</h3>
                                    <p className="mb-4 text-muted-foreground">Start by importing your first CSV file.</p>
                                    <Button asChild>
                                        <Link href={route('transaction-imports.create')}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Import Transactions
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {account.imports?.map((importData) => (
                                        <div key={importData.id} className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <p className="text-sm font-medium">{importData.filename}</p>
                                                    {getStatusBadge(importData.status)}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {importData.csv_schema?.name || 'Unknown Schema'} • {formatDateTime(importData.created_at)}
                                                </p>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <div className="text-sm font-medium">{importData.imported_rows} transactions</div>
                                                {importData.duplicate_rows > 0 && (
                                                    <div className="text-xs text-muted-foreground">{importData.duplicate_rows} duplicates</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Account Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Account Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Account Name</Label>
                                <p className="text-sm">{account.name}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Account Number</Label>
                                <p className="text-sm">{account.number}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Sort Code</Label>
                                <p className="text-sm">{account.sort_code}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                                <p className="text-sm">{formatDate(account.created_at)}</p>
                            </div>
                            {account.description && (
                                <div className="md:col-span-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                                    <p className="text-sm">{account.description}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
