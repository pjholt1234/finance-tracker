import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { CsvPreviewData } from '@/types/global';

interface PreviewStepProps {
    csvPreview: CsvPreviewData | null;
    transactionDataStart: number | string;
    onTransactionDataStartChange: (value: number | string) => void;
    errors: Partial<Record<string, string>>;
}

export function PreviewStep({
    csvPreview,
    transactionDataStart,
    onTransactionDataStartChange,
    errors
}: PreviewStepProps) {
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
                            value={transactionDataStart}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                    onTransactionDataStartChange('' as any);
                                } else {
                                    const numValue = parseInt(value);
                                    if (!isNaN(numValue) && numValue >= 1) {
                                        onTransactionDataStartChange(numValue);
                                    }
                                }
                            }}
                            onBlur={(e) => {
                                if (e.target.value === '' || parseInt(e.target.value) < 1) {
                                    onTransactionDataStartChange(1);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    const currentValue = typeof transactionDataStart === 'number' ? transactionDataStart : 1;
                                    if (currentValue > 1) {
                                        onTransactionDataStartChange(currentValue - 1);
                                    }
                                } else if (e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    const currentValue = typeof transactionDataStart === 'number' ? transactionDataStart : 1;
                                    onTransactionDataStartChange(currentValue + 1);
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
                                                className={`border-t ${rowIndex + 1 >= (typeof transactionDataStart === 'number' ? transactionDataStart : 1)
                                                    ? 'bg-green-50 dark:bg-green-950/20'
                                                    : ''
                                                    }`}
                                            >
                                                <td className="px-3 py-2 font-medium">
                                                    {rowIndex + 1}
                                                    {rowIndex + 1 === (typeof transactionDataStart === 'number' ? transactionDataStart : 1) && (
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
}
