import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Account, CsvSchema } from '@/types/global';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Building2, Calendar, CheckCircle, CreditCard, DollarSign, FileText, Hash, Plus, Upload } from 'lucide-react';
import { useState } from 'react';

interface ImportForm {
    csv_file: File | null;
    csv_schema_id: string;
    account_id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

interface Props {
    schemas: CsvSchema[];
    accounts: Account[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Imports',
        href: '/imports',
    },
    {
        title: 'Import Transactions',
        href: '/imports/create',
    },
];

export default function Import({ schemas, accounts }: Props) {
    const [selectedSchema, setSelectedSchema] = useState<CsvSchema | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

    const { data, setData, processing, errors } = useForm<ImportForm>({
        csv_file: null,
        csv_schema_id: '',
        account_id: '',
    });

    const handleSchemaChange = (schemaId: string) => {
        setData('csv_schema_id', schemaId);
        const schema = schemas.find((s) => s.id.toString() === schemaId);
        setSelectedSchema(schema || null);
    };

    const handleAccountChange = (accountId: string) => {
        setData('account_id', accountId);
        const account = accounts.find((a) => a.id.toString() === accountId);
        setSelectedAccount(account || null);

        // Pre-populate schema if account has one associated
        if (account?.csv_schema_id) {
            setData('csv_schema_id', account.csv_schema_id.toString());
            const schema = schemas.find((s) => s.id === account.csv_schema_id);
            setSelectedSchema(schema || null);
        }
    };

    const handleFileUpload = (file: File) => {
        setData('csv_file', file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.csv_file || !data.csv_schema_id || !data.account_id) {
            return;
        }

        const formData = new FormData();
        formData.append('csv_file', data.csv_file);
        formData.append('csv_schema_id', data.csv_schema_id);
        formData.append('account_id', data.account_id);

        router.post(route('transaction-imports.store'), formData);
    };

    const getAmountConfiguration = (schema: CsvSchema) => {
        if (schema.amount_column) {
            return { type: 'single', column: schema.amount_column };
        }

        const columns = [];
        if (schema.paid_in_column) columns.push(`In: ${schema.paid_in_column}`);
        if (schema.paid_out_column) columns.push(`Out: ${schema.paid_out_column}`);

        return { type: 'split', column: columns.join(', ') };
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(amount / 100);
    };

    const canSubmit = data.csv_file && data.csv_schema_id && data.account_id;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Import Transactions" />

            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={route('transaction-imports.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Import Transactions</h1>
                        <p className="text-muted-foreground">Upload a CSV file and map it to your account using a schema.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Configuration and Import */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Upload className="h-5 w-5" />
                                    <span>Configuration and Import</span>
                                </CardTitle>
                                <CardDescription>Configure your import settings and upload your CSV file.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Configuration Grid */}
                                <div className="grid gap-6 md:grid-cols-2">
                                    {/* Account Selection */}
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <Label htmlFor="account" className="text-sm font-medium">
                                                Account *
                                            </Label>
                                        </div>
                                        <Select value={data.account_id} onValueChange={handleAccountChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {accounts.map((account) => (
                                                    <SelectItem key={account.id} value={account.id.toString()}>
                                                        <div className="flex items-center space-x-2">
                                                            <CreditCard className="h-4 w-4" />
                                                            <span>{account.name}</span>
                                                            <span className="text-sm text-muted-foreground">({account.number})</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.account_id && <p className="text-sm text-destructive">{errors.account_id}</p>}
                                        {accounts.length === 0 && (
                                            <Alert>
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>You need to create an account first.</AlertDescription>
                                            </Alert>
                                        )}
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={route('accounts.create')}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create New Account
                                            </Link>
                                        </Button>
                                    </div>

                                    {/* CSV Schema Selection */}
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <Label htmlFor="schema" className="text-sm font-medium">
                                                CSV Schema *
                                            </Label>
                                        </div>
                                        <Select value={data.csv_schema_id} onValueChange={handleSchemaChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a schema" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {schemas.map((schema) => (
                                                    <SelectItem key={schema.id} value={schema.id.toString()}>
                                                        {schema.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.csv_schema_id && <p className="text-sm text-destructive">{errors.csv_schema_id}</p>}
                                        {schemas.length === 0 && (
                                            <Alert>
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>You need to create a CSV schema first.</AlertDescription>
                                            </Alert>
                                        )}
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={route('csv-schemas.create')}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create New Schema
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                                {/* File Upload */}
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Upload className="h-4 w-4 text-muted-foreground" />
                                        <Label htmlFor="csv_file" className="text-sm font-medium">
                                            CSV File *
                                        </Label>
                                    </div>
                                    <Input
                                        id="csv_file"
                                        type="file"
                                        accept=".csv,.txt"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                handleFileUpload(file);
                                            }
                                        }}
                                        className={errors.csv_file ? 'border-destructive' : ''}
                                    />
                                    {errors.csv_file && <p className="text-sm text-destructive">{errors.csv_file}</p>}
                                    {data.csv_file && (
                                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                            <FileText className="h-4 w-4" />
                                            <span>Selected: {data.csv_file.name}</span>
                                            <span>({(data.csv_file.size / 1024).toFixed(1)} KB)</span>
                                        </div>
                                    )}
                                </div>

                                {/* Configuration Preview */}
                                {(selectedAccount || selectedSchema) && (
                                    <div className="rounded-lg border bg-muted/50 p-4">
                                        <h4 className="mb-3 font-medium">Configuration Preview</h4>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {selectedAccount && (
                                                <div className="space-y-2">
                                                    <h5 className="text-sm font-medium text-muted-foreground">Selected Account</h5>
                                                    <div className="space-y-1 text-sm">
                                                        <div className="flex justify-between">
                                                            <span>Name:</span>
                                                            <span className="font-medium">{selectedAccount.name}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Number:</span>
                                                            <span className="font-medium">{selectedAccount.number}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Balance:</span>
                                                            <span className="font-medium">{formatCurrency(selectedAccount.balance)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedSchema && (
                                                <div className="space-y-2">
                                                    <h5 className="text-sm font-medium text-muted-foreground">Schema Configuration</h5>
                                                    <div className="space-y-1 text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <Hash className="h-3 w-3 text-muted-foreground" />
                                                            <span>Data starts at row {selectedSchema.transaction_data_start}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                                            <span>Date: Column {selectedSchema.date_column}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                                                            <span>Amount: {getAmountConfiguration(selectedSchema).column}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Import Action */}
                                <div className="flex items-center justify-between border-t pt-4">
                                    <div className="space-y-1">
                                        <h4 className="font-medium">Ready to Import</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {canSubmit
                                                ? 'All configurations are set. Click import to continue.'
                                                : 'Please complete all required fields above.'}
                                        </p>
                                    </div>
                                    <Button type="submit" disabled={!canSubmit || processing} className="min-w-[120px]">
                                        {processing ? (
                                            <>Processing...</>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Import
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
