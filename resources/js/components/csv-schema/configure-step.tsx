import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CsvPreviewData } from '@/types/global';
import { AlertCircle, Calendar, DollarSign, Hash } from 'lucide-react';

interface ConfigureStepProps {
    csvPreview: CsvPreviewData | null;
    data: {
        description_column: number | string;
        balance_column: number | string;
        date_column: number | string;
        date_format: string;
        amount_type: 'single' | 'split';
        amount_column: number | string;
        paid_in_column: number | string;
        paid_out_column: number | string;
        transaction_data_start: number | string;
    };
    errors: Partial<Record<string, string>>;
    onDataChange: (key: string, value: string | number) => void;
}

export function ConfigureStep({ csvPreview, data, errors, onDataChange }: ConfigureStepProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Configure Column Mapping
                </CardTitle>
                <CardDescription>Map your CSV columns to transaction data fields</CardDescription>
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
                                onValueChange={(value) => onDataChange('description_column', parseInt(value))}
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
                                onValueChange={(value) => onDataChange('balance_column', parseInt(value))}
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
                            {errors.balance_column && <p className="text-xs text-destructive">{errors.balance_column}</p>}
                        </div>

                        {/* Date Column */}
                        <div className="grid gap-2">
                            <Label htmlFor="date_column" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Date Column *
                            </Label>
                            <Select
                                value={data.date_column ? data.date_column.toString() : ''}
                                onValueChange={(value) => onDataChange('date_column', parseInt(value))}
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
                            {errors.date_column && <p className="text-xs text-destructive">{errors.date_column}</p>}
                        </div>

                        {/* Date Format - Disabled */}
                        <div className="grid gap-2">
                            <Label htmlFor="date_format" className="text-muted-foreground">
                                Date Format (Auto-detect)
                            </Label>
                            <Select disabled value="none">
                                <SelectTrigger className="bg-muted">
                                    <SelectValue placeholder="Auto-detect" />
                                </SelectTrigger>
                            </Select>
                            <p className="text-xs text-muted-foreground">Date format will be automatically detected</p>
                        </div>
                    </div>

                    {/* Configuration Fields - Row 2 */}
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Amount Type Selection */}
                        <div className="grid gap-2">
                            <Label>Amount Configuration</Label>
                            <Select value={data.amount_type} onValueChange={(value: 'single' | 'split') => onDataChange('amount_type', value)}>
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
                                    onValueChange={(value) => onDataChange('amount_column', parseInt(value))}
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
                                {errors.amount_column && <p className="text-xs text-destructive">{errors.amount_column}</p>}
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="paid_in_column">Paid In Column</Label>
                                    <Select
                                        value={data.paid_in_column ? data.paid_in_column.toString() : '0'}
                                        onValueChange={(value) => onDataChange('paid_in_column', parseInt(value))}
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
                                    {errors.paid_in_column && <p className="text-xs text-destructive">{errors.paid_in_column}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="paid_out_column">Paid Out Column</Label>
                                    <Select
                                        value={data.paid_out_column ? data.paid_out_column.toString() : '0'}
                                        onValueChange={(value) => onDataChange('paid_out_column', parseInt(value))}
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
                                    {errors.paid_out_column && <p className="text-xs text-destructive">{errors.paid_out_column}</p>}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Validation Alert */}
                    {data.amount_type === 'split' && !data.paid_in_column && !data.paid_out_column && (
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
                                    First 10 rows starting from row{' '}
                                    {typeof data.transaction_data_start === 'number' ? data.transaction_data_start : 1}
                                </span>
                            </div>
                            <div className="overflow-hidden rounded-lg border">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="w-16 px-3 py-2 text-left font-medium">Row</th>
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
                                                    Math.max(
                                                        0,
                                                        (typeof data.transaction_data_start === 'number' ? data.transaction_data_start : 1) - 1,
                                                    ),
                                                    Math.max(
                                                        0,
                                                        (typeof data.transaction_data_start === 'number' ? data.transaction_data_start : 1) - 1,
                                                    ) + 10,
                                                )
                                                .map((row, rowIndex) => {
                                                    const actualRowNumber =
                                                        (typeof data.transaction_data_start === 'number' ? data.transaction_data_start : 1) +
                                                        rowIndex;
                                                    return (
                                                        <tr key={rowIndex} className="border-t">
                                                            <td className="px-3 py-2 font-medium text-muted-foreground">{actualRowNumber}</td>
                                                            {row.map((cell, cellIndex) => {
                                                                const columnNumber = cellIndex + 1;
                                                                let isSelected = false;

                                                                if (
                                                                    columnNumber === data.date_column ||
                                                                    columnNumber === data.balance_column ||
                                                                    columnNumber === data.amount_column ||
                                                                    (columnNumber === data.paid_in_column && data.paid_in_column) ||
                                                                    (columnNumber === data.paid_out_column && data.paid_out_column) ||
                                                                    (columnNumber === data.description_column && data.description_column)
                                                                ) {
                                                                    isSelected = true;
                                                                }

                                                                return (
                                                                    <td key={cellIndex} className={`px-3 py-2 ${isSelected ? 'bg-primary/5' : ''}`}>
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
}
