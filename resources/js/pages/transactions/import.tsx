import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ArrowLeft,
    Upload,
    FileText,
    AlertCircle,
    Calendar,
    DollarSign,
    Hash,
    CheckCircle
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';

interface CsvSchema {
    id: number;
    name: string;
    transaction_data_start: number;
    date_column: string;
    balance_column: string;
    amount_column?: string;
    paid_in_column?: string;
    paid_out_column?: string;
    description_column?: string;
    date_format?: string;
    created_at: string;
}

interface ImportForm {
    csv_file: File | null;
    csv_schema_id: string;
    [key: string]: any;
}

interface Props {
    schemas: CsvSchema[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaction Imports',
        href: '/transaction-imports',
    },
    {
        title: 'Import Transactions',
        href: '/transaction-imports/create',
    },
];

export default function Import({ schemas }: Props) {
    const [selectedSchema, setSelectedSchema] = useState<CsvSchema | null>(null);

    const { data, setData, post, processing, errors } = useForm<ImportForm>({
        csv_file: null,
        csv_schema_id: '',
    });

    const handleSchemaChange = (schemaId: string) => {
        setData('csv_schema_id', schemaId);
        const schema = schemas.find(s => s.id.toString() === schemaId);
        setSelectedSchema(schema || null);
    };

    const handleFileUpload = (file: File) => {
        setData('csv_file', file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.csv_file || !data.csv_schema_id) {
            return;
        }

        const formData = new FormData();
        formData.append('csv_file', data.csv_file);
        formData.append('csv_schema_id', data.csv_schema_id);

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

    const canSubmit = data.csv_file && data.csv_schema_id;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Import Transactions" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Link href={route('transaction-imports.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Imports
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold">Import Transactions</h2>
                        <p className="text-muted-foreground mt-1">
                            Upload a CSV file to import transaction data
                        </p>
                    </div>
                </div>

                {schemas.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No CSV schemas available</h3>
                            <p className="text-muted-foreground text-center mb-6">
                                You need to create a CSV schema first before you can import transactions.
                            </p>
                            <Link href={route('csv-schemas.create')}>
                                <Button>
                                    Create CSV Schema
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Schema Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Select CSV Schema
                                </CardTitle>
                                <CardDescription>
                                    Choose the schema that matches your CSV file format
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="csv_schema_id">CSV Schema</Label>
                                    <Select
                                        value={data.csv_schema_id}
                                        onValueChange={handleSchemaChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a CSV schema" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {schemas.map((schema) => (
                                                <SelectItem key={schema.id} value={schema.id.toString()}>
                                                    {schema.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.csv_schema_id && (
                                        <p className="text-sm text-destructive">{errors.csv_schema_id}</p>
                                    )}
                                </div>

                                {selectedSchema && (
                                    <div className="mt-4 p-4 bg-muted rounded-lg">
                                        <h4 className="font-medium mb-3">Schema Configuration</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center">
                                                <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>Data starts at row {selectedSchema.transaction_data_start}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>Date: Column {selectedSchema.date_column}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>Balance: Column {selectedSchema.balance_column}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>Amount: {getAmountConfiguration(selectedSchema).column}</span>
                                            </div>
                                            {selectedSchema.description_column && (
                                                <div className="flex items-center">
                                                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    <span>Description: Column {selectedSchema.description_column}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* File Upload */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Upload className="h-5 w-5" />
                                    Upload CSV File
                                </CardTitle>
                                <CardDescription>
                                    Select the CSV file containing your transaction data
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground">
                                                Drop your CSV file here or click to browse
                                            </p>
                                            <Input
                                                type="file"
                                                accept=".csv,.txt"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        handleFileUpload(file);
                                                    }
                                                }}
                                                className="max-w-xs mx-auto"
                                                disabled={processing}
                                            />
                                        </div>
                                    </div>

                                    {data.csv_file && (
                                        <Alert>
                                            <CheckCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                File selected: {data.csv_file.name} ({(data.csv_file.size / 1024).toFixed(1)} KB)
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {errors.csv_file && (
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>{errors.csv_file}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submit */}
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={!canSubmit || processing}
                                className="min-w-32"
                            >
                                {processing ? 'Importing...' : 'Import Transactions'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </AppLayout>
    );
} 