import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { FormEvent } from 'react';

interface SaveStepProps {
    data: {
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
    };
    errors: Partial<Record<string, string>>;
    processing: boolean;
    onDataChange: (key: string, value: any) => void;
    onSubmit: (e: FormEvent) => void;
    onBack: () => void;
}

export function SaveStep({ data, errors, processing, onDataChange, onSubmit, onBack }: SaveStepProps) {
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
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Schema Name *</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => onDataChange('name', e.target.value)}
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
                        <Button type="button" variant="outline" onClick={onBack}>
                            Back
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Schema'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
} 