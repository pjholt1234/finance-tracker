import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    Save,
    Calendar,
    DollarSign,
    Hash,
    FileText,
    AlertCircle,
    Info
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';

interface CsvSchema {
    id: number;
    name: string;
    transaction_data_start: number;
    date_column: number;
    balance_column: number;
    amount_column?: number;
    paid_in_column?: number;
    paid_out_column?: number;
    description_column?: number;
    date_format?: string;
    created_at: string;
    updated_at: string;
}

interface EditSchemaForm {
    name: string;
    transaction_data_start: number;
    date_column: number;
    balance_column: number;
    amount_column: number;
    paid_in_column: number;
    paid_out_column: number;
    description_column: number;
    date_format: string;
    amount_type: 'single' | 'split';
    [key: string]: any;
}

interface Props {
    schema: CsvSchema;
    available_columns: { [key: number]: string };
    available_date_formats: string[];
}

export default function Edit({ schema, available_columns, available_date_formats }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'CSV Schemas',
            href: '/csv-schemas',
        },
        {
            title: schema.name,
            href: `/csv-schemas/${schema.id}`,
        },
        {
            title: 'Edit',
            href: `/csv-schemas/${schema.id}/edit`,
        },
    ];

    const { data, setData, put, processing, errors } = useForm<EditSchemaForm>({
        name: schema.name,
        transaction_data_start: schema.transaction_data_start,
        date_column: schema.date_column,
        balance_column: schema.balance_column,
        amount_column: schema.amount_column || 0,
        paid_in_column: schema.paid_in_column || 0,
        paid_out_column: schema.paid_out_column || 0,
        description_column: schema.description_column || 0,
        date_format: schema.date_format || '',
        amount_type: schema.amount_column ? 'single' : 'split',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('csv-schemas.update', schema.id));
    };

    const canSave = () => {
        if (!data.name.trim() || !data.date_column || !data.balance_column) {
            return false;
        }

        if (data.amount_type === 'single') {
            return !!data.amount_column;
        } else {
            return !!(data.paid_in_column || data.paid_out_column);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Schema: ${schema.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl overflow-x-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Edit CSV Schema</h2>
                        <p className="text-muted-foreground mt-1">
                            Update your CSV import configuration
                        </p>
                    </div>
                    <Link href={route('csv-schemas.show', schema.id)}>
                        <Button variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Schema
                        </Button>
                    </Link>
                </div>

                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Note: Changes to this schema will only affect future CSV imports.
                        Existing transactions imported with this schema will not be modified.
                    </AlertDescription>
                </Alert>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Schema Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g., Bank Statement Schema"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">{errors.name}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="transaction_data_start">Transaction Data Start Row *</Label>
                                <Input
                                    id="transaction_data_start"
                                    type="number"
                                    min="1"
                                    value={data.transaction_data_start}
                                    onChange={(e) => setData('transaction_data_start', parseInt(e.target.value) || 1)}
                                    className="max-w-32"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Row number where actual transaction data begins (after headers)
                                </p>
                                {errors.transaction_data_start && (
                                    <p className="text-xs text-destructive">{errors.transaction_data_start}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Column Mapping */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Hash className="h-5 w-5" />
                                Column Mapping
                            </CardTitle>
                            <CardDescription>
                                Map your CSV columns to transaction data fields
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Amount Type Selection */}
                            <div className="grid gap-2">
                                <Label>Amount Configuration</Label>
                                <Select
                                    value={data.amount_type}
                                    onValueChange={(value: 'single' | 'split') => {
                                        setData('amount_type', value);
                                        // Clear the opposite fields when switching types
                                        if (value === 'single') {
                                            setData('paid_in_column', 0);
                                            setData('paid_out_column', 0);
                                        } else {
                                            setData('amount_column', 0);
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single">Single Amount Column</SelectItem>
                                        <SelectItem value="split">Separate Paid In/Out Columns</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            {/* Required Fields */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="date_column" className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Date Column *
                                    </Label>
                                    <Select
                                        value={data.date_column.toString() === "0" ? "" : data.date_column.toString()}
                                        onValueChange={(value) => setData('date_column', parseInt(value) || 0)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select date column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(available_columns).map(([key, value]) => (
                                                <SelectItem key={key} value={key}>
                                                    {value}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.date_column && (
                                        <p className="text-xs text-destructive">{errors.date_column}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="balance_column" className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Balance Column *
                                    </Label>
                                    <Select
                                        value={data.balance_column.toString() === "0" ? "" : data.balance_column.toString()}
                                        onValueChange={(value) => setData('balance_column', parseInt(value) || 0)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select balance column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(available_columns).map(([key, value]) => (
                                                <SelectItem key={key} value={key}>
                                                    {value}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.balance_column && (
                                        <p className="text-xs text-destructive">{errors.balance_column}</p>
                                    )}
                                </div>
                            </div>

                            {/* Amount Columns */}
                            {data.amount_type === 'single' ? (
                                <div className="grid gap-2">
                                    <Label htmlFor="amount_column" className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Amount Column *
                                    </Label>
                                    <Select
                                        value={data.amount_column.toString() === "0" ? "" : data.amount_column.toString()}
                                        onValueChange={(value) => setData('amount_column', parseInt(value) || 0)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select amount column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(available_columns).map(([key, value]) => (
                                                <SelectItem key={key} value={key}>
                                                    {value}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.amount_column && (
                                        <p className="text-xs text-destructive">{errors.amount_column}</p>
                                    )}
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="paid_in_column">Paid In Column</Label>
                                        <Select
                                            value={data.paid_in_column.toString() === "0" ? "none" : data.paid_in_column.toString()}
                                            onValueChange={(value) => setData('paid_in_column', value === "none" ? 0 : parseInt(value) || 0)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select paid in column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {Object.entries(available_columns).map(([key, value]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {value}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.paid_in_column && (
                                            <p className="text-xs text-destructive">{errors.paid_in_column}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="paid_out_column">Paid Out Column</Label>
                                        <Select
                                            value={data.paid_out_column.toString() === "0" ? "none" : data.paid_out_column.toString()}
                                            onValueChange={(value) => setData('paid_out_column', value === "none" ? 0 : parseInt(value) || 0)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select paid out column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {Object.entries(available_columns).map(([key, value]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {value}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.paid_out_column && (
                                            <p className="text-xs text-destructive">{errors.paid_out_column}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <Separator />

                            {/* Optional Fields */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="description_column">Description Column (Optional)</Label>
                                    <Select
                                        value={data.description_column.toString() === "0" ? "none" : data.description_column.toString()}
                                        onValueChange={(value) => setData('description_column', value === "none" ? 0 : parseInt(value) || 0)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select description column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {Object.entries(available_columns).map(([key, value]) => (
                                                <SelectItem key={key} value={key}>
                                                    {value}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.description_column && (
                                        <p className="text-xs text-destructive">{errors.description_column}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="date_format">Date Format (Optional)</Label>
                                    <Select
                                        value={data.date_format === "" ? "auto" : data.date_format}
                                        onValueChange={(value) => setData('date_format', value === "auto" ? "" : value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Auto-detect or select format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="auto">Auto-detect</SelectItem>
                                            {available_date_formats.map((format) => (
                                                <SelectItem key={format} value={format}>
                                                    {format}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.date_format && (
                                        <p className="text-xs text-destructive">{errors.date_format}</p>
                                    )}
                                </div>
                            </div>

                            {/* Validation Alert */}
                            {data.amount_type === 'split' && data.paid_in_column === 0 && data.paid_out_column === 0 && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        You must select at least one of Paid In or Paid Out columns when using split amount configuration.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {/* Configuration Preview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration Preview</CardTitle>
                            <CardDescription>
                                Review your updated schema configuration
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted rounded-lg p-4">
                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="space-y-1">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Schema Name
                                        </div>
                                        <div className="text-sm">
                                            {data.name || 'Unnamed Schema'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Data Start Row
                                        </div>
                                        <div className="text-sm">
                                            Row {data.transaction_data_start}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Date Column
                                        </div>
                                        <div className="text-sm">
                                            {data.date_column !== 0 ? available_columns[data.date_column] : 'Not selected'}
                                            {data.date_format && (
                                                <Badge variant="secondary" className="ml-2 text-xs">
                                                    {data.date_format}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Balance Column
                                        </div>
                                        <div className="text-sm">
                                            {data.balance_column !== 0 ? available_columns[data.balance_column] : 'Not selected'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Amount Configuration
                                        </div>
                                        <div className="text-sm">
                                            {data.amount_type === 'single' ? (
                                                <>
                                                    <Badge variant="default" className="text-xs mb-1">Single</Badge>
                                                    {data.amount_column !== 0 ? available_columns[data.amount_column] : 'Not selected'}
                                                </>
                                            ) : (
                                                <>
                                                    <Badge variant="outline" className="text-xs mb-1">Split</Badge>
                                                    {data.paid_in_column !== 0 && (
                                                        <div>In: {available_columns[data.paid_in_column]}</div>
                                                    )}
                                                    {data.paid_out_column !== 0 && (
                                                        <div>Out: {available_columns[data.paid_out_column]}</div>
                                                    )}
                                                    {data.paid_in_column === 0 && data.paid_out_column === 0 && (
                                                        <div className="text-muted-foreground">None selected</div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {data.description_column !== 0 && (
                                        <div className="space-y-1">
                                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                Description Column
                                            </div>
                                            <div className="text-sm">
                                                {available_columns[data.description_column]}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form Actions */}
                    <div className="flex gap-3">
                        <Button type="submit" disabled={processing || !canSave()}>
                            <Save className="h-4 w-4 mr-2" />
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Link href={route('csv-schemas.show', schema.id)}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
} 