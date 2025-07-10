import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ArrowLeft,
    Upload,
    FileText,
    CheckCircle,
    AlertCircle,
    Calendar,
    DollarSign,
    Hash,
    Eye
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';

interface CsvPreviewData {
    headers: string[];
    rows: string[][];
    detected_date_formats: string[];
}

interface CreateSchemaForm {
    name: string;
    csv_file: File | null;
    transaction_data_start: number | string;
    date_column: number | string;
    balance_column: number | string;
    amount_column: number | string;
    paid_in_column: number | string;
    paid_out_column: number | string;
    description_column: number | string;
    date_format: string;
    amount_type: 'single' | 'split';
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'CSV Schemas',
        href: '/csv-schemas',
    },
    {
        title: 'Create Schema',
        href: '/csv-schemas/create',
    },
];

const STEPS = {
    UPLOAD: 1,
    PREVIEW: 2,
    CONFIGURE: 3,
    SAVE: 4,
} as const;

type StepValue = typeof STEPS[keyof typeof STEPS];

export default function Create({ preview }: { preview?: CsvPreviewData }) {
    const [currentStep, setCurrentStep] = useState<StepValue>(preview ? STEPS.PREVIEW : STEPS.UPLOAD);
    const [csvPreview, setCsvPreview] = useState<CsvPreviewData | null>(preview || null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    // Update csvPreview when preview prop changes
    useEffect(() => {
        if (preview) {
            setCsvPreview(preview);
            setCurrentStep(STEPS.PREVIEW);
        }
    }, [preview]);

    const { data, setData, post, processing, errors } = useForm<CreateSchemaForm>({
        name: '',
        csv_file: null,
        transaction_data_start: 2,
        date_column: '',
        balance_column: '',
        amount_column: '',
        paid_in_column: 0,
        paid_out_column: 0,
        description_column: 0,
        date_format: 'none',
        amount_type: 'single',
    });

    const handleFileUpload = useCallback((file: File) => {
        setData('csv_file', file);
        setIsLoadingPreview(true);

        const formData = new FormData();
        formData.append('csv_file', file);

        router.post(route('csv-schemas.preview'), formData, {
            onFinish: () => {
                setIsLoadingPreview(false);
            },
            onError: (errors) => {
                setIsLoadingPreview(false);
            },
            onSuccess: (page) => {
            },
            preserveState: false,
            preserveScroll: false,
        });
    }, [setData]);

    const handleNext = () => {
        if (currentStep < STEPS.SAVE) {
            setCurrentStep((currentStep + 1) as StepValue);
        }
    };

    const handleBack = () => {
        if (currentStep > STEPS.UPLOAD) {
            setCurrentStep((currentStep - 1) as StepValue);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Convert form data to proper types for backend
        const submitData = {
            ...data,
            transaction_data_start: typeof data.transaction_data_start === 'number' ? data.transaction_data_start : 1,
            date_column: typeof data.date_column === 'number' ? data.date_column : parseInt(data.date_column as string) || 0,
            balance_column: typeof data.balance_column === 'number' ? data.balance_column : parseInt(data.balance_column as string) || 0,
            amount_column: typeof data.amount_column === 'number' ? data.amount_column : parseInt(data.amount_column as string) || null,
            paid_in_column: typeof data.paid_in_column === 'number' ? (data.paid_in_column || null) : (parseInt(data.paid_in_column as string) || null),
            paid_out_column: typeof data.paid_out_column === 'number' ? (data.paid_out_column || null) : (parseInt(data.paid_out_column as string) || null),
            description_column: typeof data.description_column === 'number' ? (data.description_column || null) : (parseInt(data.description_column as string) || null),
            date_format: data.date_format === 'none' ? '' : data.date_format,
        };

        router.post(route('csv-schemas.store'), submitData);
    };

    const getStepProgress = () => {
        return ((currentStep - 1) / (Object.keys(STEPS).length - 1)) * 100;
    };

    const canProceed = () => {
        switch (currentStep) {
            case STEPS.UPLOAD:
                return data.csv_file !== null;
            case STEPS.PREVIEW:
                return typeof data.transaction_data_start === 'number' && data.transaction_data_start >= 1;
            case STEPS.CONFIGURE:
                if (data.amount_type === 'single') {
                    return data.date_column && data.balance_column && data.amount_column;
                } else {
                    return data.date_column && data.balance_column &&
                        (data.paid_in_column || data.paid_out_column);
                }
            case STEPS.SAVE:
                return data.name.trim().length > 0;
            default:
                return false;
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case STEPS.UPLOAD:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Upload CSV File
                            </CardTitle>
                            <CardDescription>
                                Select a CSV file containing your transaction data
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
                                            accept=".csv"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    handleFileUpload(file);
                                                }
                                            }}
                                            className="max-w-xs mx-auto"
                                            disabled={isLoadingPreview}
                                        />
                                    </div>
                                </div>
                                {isLoadingPreview && (
                                    <Alert>
                                        <Upload className="h-4 w-4 animate-spin" />
                                        <AlertDescription>
                                            Processing CSV file...
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {data.csv_file && !isLoadingPreview && (
                                    <Alert>
                                        <CheckCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            File selected: {data.csv_file.name} ({Math.round(data.csv_file.size / 1024)} KB)
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
                );

            case STEPS.PREVIEW:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5" />
                                Preview CSV Data
                            </CardTitle>
                            <CardDescription>
                                Review your CSV data and specify where transaction data begins
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="transaction_data_start">Transaction Data Start Row</Label>
                                    <Input
                                        id="transaction_data_start"
                                        type="number"
                                        min="1"
                                        value={data.transaction_data_start}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '') {
                                                // Allow empty value temporarily
                                                setData('transaction_data_start', '' as any);
                                            } else {
                                                const numValue = parseInt(value);
                                                if (!isNaN(numValue) && numValue >= 1) {
                                                    setData('transaction_data_start', numValue);
                                                }
                                            }
                                        }}
                                        onBlur={(e) => {
                                            // If empty on blur, default to 1
                                            if (e.target.value === '' || parseInt(e.target.value) < 1) {
                                                setData('transaction_data_start', 1);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'ArrowUp') {
                                                e.preventDefault();
                                                const currentValue = typeof data.transaction_data_start === 'number' ? data.transaction_data_start : 1;
                                                if (currentValue > 1) {
                                                    setData('transaction_data_start', currentValue - 1);
                                                }
                                            } else if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                const currentValue = typeof data.transaction_data_start === 'number' ? data.transaction_data_start : 1;
                                                setData('transaction_data_start', currentValue + 1);
                                            }
                                        }}
                                        className="max-w-32"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Row number where actual transaction data begins (after headers). Use ↑↓ arrow keys to adjust.
                                    </p>
                                </div>

                                {csvPreview && (
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left font-medium">Row 1-{Math.min(10, csvPreview.rows.length)}</th>
                                                        {csvPreview.headers.map((header, index) => (
                                                            <th key={index} className="px-3 py-2 text-left font-medium">
                                                                {header || `Column ${index + 1}`}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {csvPreview.rows.slice(0, 10).map((row, rowIndex) => (
                                                        <tr
                                                            key={rowIndex}
                                                            className={`border-t ${rowIndex + 1 >= (typeof data.transaction_data_start === 'number' ? data.transaction_data_start : 1)
                                                                ? 'bg-green-50 dark:bg-green-950/20'
                                                                : ''
                                                                }`}
                                                        >
                                                            <td className="px-3 py-2 font-medium">
                                                                {rowIndex + 1}
                                                                {rowIndex + 1 === (typeof data.transaction_data_start === 'number' ? data.transaction_data_start : 1) && (
                                                                    <Badge variant="secondary" className="ml-2 text-xs">
                                                                        Start
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                            {row.map((cell, cellIndex) => (
                                                                <td key={cellIndex} className="px-3 py-2">
                                                                    {cell}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );

            case STEPS.CONFIGURE:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Hash className="h-5 w-5" />
                                Configure Column Mapping
                            </CardTitle>
                            <CardDescription>
                                Map your CSV columns to transaction data fields
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Configuration Fields - Row 1 */}
                                <div className="grid gap-4 md:grid-cols-4">
                                    {/* Description Column */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="description_column">Description Column (Optional)</Label>
                                        <Select
                                            value={data.description_column ? data.description_column.toString() : '0'}
                                            onValueChange={(value) => setData('description_column', parseInt(value))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select description column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0">None</SelectItem>
                                                {csvPreview?.headers.map((header, index) => (
                                                    <SelectItem key={index} value={(index + 1).toString()}>
                                                        Column {index + 1}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Balance Column */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="balance_column" className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" />
                                            Balance Column *
                                        </Label>
                                        <Select
                                            value={data.balance_column ? data.balance_column.toString() : ''}
                                            onValueChange={(value) => setData('balance_column', parseInt(value))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select balance column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {csvPreview?.headers.map((header, index) => (
                                                    <SelectItem key={index} value={(index + 1).toString()}>
                                                        Column {index + 1}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.balance_column && (
                                            <p className="text-xs text-destructive">{errors.balance_column}</p>
                                        )}
                                    </div>

                                    {/* Date Column */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="date_column" className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Date Column *
                                        </Label>
                                        <Select
                                            value={data.date_column ? data.date_column.toString() : ''}
                                            onValueChange={(value) => setData('date_column', parseInt(value))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select date column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {csvPreview?.headers.map((header, index) => (
                                                    <SelectItem key={index} value={(index + 1).toString()}>
                                                        Column {index + 1}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.date_column && (
                                            <p className="text-xs text-destructive">{errors.date_column}</p>
                                        )}
                                    </div>

                                    {/* Date Format - Disabled */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="date_format" className="text-muted-foreground">Date Format (Auto-detect)</Label>
                                        <Select disabled value="none">
                                            <SelectTrigger className="bg-muted">
                                                <SelectValue placeholder="Auto-detect" />
                                            </SelectTrigger>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Date format will be automatically detected
                                        </p>
                                    </div>
                                </div>

                                {/* Configuration Fields - Row 2 */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    {/* Amount Type Selection */}
                                    <div className="grid gap-2">
                                        <Label>Amount Configuration</Label>
                                        <Select
                                            value={data.amount_type}
                                            onValueChange={(value: 'single' | 'split') => setData('amount_type', value)}
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

                                    {/* Amount Columns */}
                                    {data.amount_type === 'single' ? (
                                        <div className="grid gap-2">
                                            <Label htmlFor="amount_column" className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" />
                                                Amount Column *
                                            </Label>
                                            <Select
                                                value={data.amount_column ? data.amount_column.toString() : ''}
                                                onValueChange={(value) => setData('amount_column', parseInt(value))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select amount column" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {csvPreview?.headers.map((header, index) => (
                                                        <SelectItem key={index} value={(index + 1).toString()}>
                                                            Column {index + 1}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.amount_column && (
                                                <p className="text-xs text-destructive">{errors.amount_column}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="paid_in_column">Paid In Column</Label>
                                                <Select
                                                    value={data.paid_in_column ? data.paid_in_column.toString() : '0'}
                                                    onValueChange={(value) => setData('paid_in_column', parseInt(value))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select paid in column" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0">None</SelectItem>
                                                        {csvPreview?.headers.map((header, index) => (
                                                            <SelectItem key={index} value={(index + 1).toString()}>
                                                                Column {index + 1}
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
                                                    value={data.paid_out_column ? data.paid_out_column.toString() : '0'}
                                                    onValueChange={(value) => setData('paid_out_column', parseInt(value))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select paid out column" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0">None</SelectItem>
                                                        {csvPreview?.headers.map((header, index) => (
                                                            <SelectItem key={index} value={(index + 1).toString()}>
                                                                Column {index + 1}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.paid_out_column && (
                                                    <p className="text-xs text-destructive">{errors.paid_out_column}</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Validation Alert */}
                                {data.amount_type === 'split' &&
                                    !data.paid_in_column &&
                                    !data.paid_out_column && (
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                You must select at least one of Paid In or Paid Out columns when using split amount configuration.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                {/* CSV Preview */}
                                {csvPreview && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium">Data Preview</h4>
                                            <span className="text-sm text-muted-foreground">
                                                First 10 rows starting from row {typeof data.transaction_data_start === 'number' ? data.transaction_data_start : 1}
                                            </span>
                                        </div>
                                        <div className="border rounded-lg overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left font-medium w-16">Row</th>
                                                            {csvPreview.headers.map((header, index) => {
                                                                const columnNumber = index + 1;
                                                                let isSelected = false;
                                                                let columnType = '';

                                                                if (columnNumber === data.date_column) {
                                                                    isSelected = true;
                                                                    columnType = 'Date';
                                                                } else if (columnNumber === data.balance_column) {
                                                                    isSelected = true;
                                                                    columnType = 'Balance';
                                                                } else if (columnNumber === data.amount_column) {
                                                                    isSelected = true;
                                                                    columnType = 'Amount';
                                                                } else if (columnNumber === data.paid_in_column && data.paid_in_column) {
                                                                    isSelected = true;
                                                                    columnType = 'Paid In';
                                                                } else if (columnNumber === data.paid_out_column && data.paid_out_column) {
                                                                    isSelected = true;
                                                                    columnType = 'Paid Out';
                                                                } else if (columnNumber === data.description_column && data.description_column) {
                                                                    isSelected = true;
                                                                    columnType = 'Description';
                                                                }

                                                                return (
                                                                    <th
                                                                        key={index}
                                                                        className={`px-3 py-2 text-left font-medium ${isSelected ? 'bg-primary/10' : ''}`}
                                                                    >
                                                                        <div className="space-y-1">
                                                                            <div>Column {index + 1}</div>
                                                                            {isSelected && (
                                                                                <Badge variant="secondary" className="text-xs">
                                                                                    {columnType}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </th>
                                                                );
                                                            })}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {csvPreview.rows
                                                            .slice(
                                                                Math.max(0, (typeof data.transaction_data_start === 'number' ? data.transaction_data_start : 1) - 1),
                                                                Math.max(0, (typeof data.transaction_data_start === 'number' ? data.transaction_data_start : 1) - 1) + 10
                                                            )
                                                            .map((row, rowIndex) => {
                                                                const actualRowNumber = (typeof data.transaction_data_start === 'number' ? data.transaction_data_start : 1) + rowIndex;
                                                                return (
                                                                    <tr key={rowIndex} className="border-t">
                                                                        <td className="px-3 py-2 font-medium text-muted-foreground">
                                                                            {actualRowNumber}
                                                                        </td>
                                                                        {row.map((cell, cellIndex) => {
                                                                            const columnNumber = cellIndex + 1;
                                                                            let isSelected = false;

                                                                            if (columnNumber === data.date_column ||
                                                                                columnNumber === data.balance_column ||
                                                                                columnNumber === data.amount_column ||
                                                                                (columnNumber === data.paid_in_column && data.paid_in_column) ||
                                                                                (columnNumber === data.paid_out_column && data.paid_out_column) ||
                                                                                (columnNumber === data.description_column && data.description_column)) {
                                                                                isSelected = true;
                                                                            }

                                                                            return (
                                                                                <td
                                                                                    key={cellIndex}
                                                                                    className={`px-3 py-2 ${isSelected ? 'bg-primary/5' : ''}`}
                                                                                >
                                                                                    {cell}
                                                                                </td>
                                                                            );
                                                                        })}
                                                                    </tr>
                                                                );
                                                            })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );

            case STEPS.SAVE:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                Save Schema
                            </CardTitle>
                            <CardDescription>
                                Give your CSV schema a name and save the configuration
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
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

                                {/* Summary */}
                                <div className="bg-muted rounded-lg p-4">
                                    <h4 className="font-medium mb-3">Configuration Summary</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>File:</span>
                                            <span>{data.csv_file?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Data starts at row:</span>
                                            <span>{data.transaction_data_start}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Date column:</span>
                                            <span>Column {data.date_column}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Balance column:</span>
                                            <span>Column {data.balance_column}</span>
                                        </div>
                                        {data.amount_type === 'single' ? (
                                            <div className="flex justify-between">
                                                <span>Amount column:</span>
                                                <span>Column {data.amount_column}</span>
                                            </div>
                                        ) : (
                                            <>
                                                {data.paid_in_column && (
                                                    <div className="flex justify-between">
                                                        <span>Paid in column:</span>
                                                        <span>Column {data.paid_in_column}</span>
                                                    </div>
                                                )}
                                                {data.paid_out_column && (
                                                    <div className="flex justify-between">
                                                        <span>Paid out column:</span>
                                                        <span>Column {data.paid_out_column}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {data.description_column && (
                                            <div className="flex justify-between">
                                                <span>Description column:</span>
                                                <span>Column {data.description_column}</span>
                                            </div>
                                        )}
                                        {data.date_format && data.date_format !== 'none' && (
                                            <div className="flex justify-between">
                                                <span>Date format:</span>
                                                <span>{data.date_format}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" onClick={handleBack}>
                                        Back
                                    </Button>
                                    <Button type="submit" disabled={processing || !canProceed()}>
                                        {processing ? 'Saving...' : 'Save Schema'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                );

            default:
                return null;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create CSV Schema" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Create CSV Schema</h2>
                        <p className="text-muted-foreground mt-1">
                            Set up a new CSV import configuration
                        </p>
                    </div>
                    <Link href={route('csv-schemas.index')}>
                        <Button variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Schemas
                        </Button>
                    </Link>
                </div>

                {/* Progress Bar */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Step {currentStep} of {Object.keys(STEPS).length}</span>
                                <span>{Math.round(getStepProgress())}% complete</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
                                    style={{ width: `${getStepProgress()}%` }}
                                ></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Step Content */}
                {isLoadingPreview ? (
                    <Card>
                        <CardContent className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                <p>Processing CSV file...</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    renderStepContent()
                )}

                {/* Navigation */}
                {currentStep !== STEPS.UPLOAD && currentStep !== STEPS.SAVE && !isLoadingPreview && (
                    <div className="flex justify-between">
                        <Button variant="outline" onClick={handleBack}>
                            Back
                        </Button>
                        <Button onClick={handleNext} disabled={!canProceed()}>
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
} 