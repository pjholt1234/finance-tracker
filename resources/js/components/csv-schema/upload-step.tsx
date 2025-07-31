import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, FileText, Upload } from 'lucide-react';

interface UploadStepProps {
    csvFile: File | null;
    isLoading: boolean;
    errors: Partial<Record<string, string>>;
    onFileUpload: (file: File) => void;
}

export function UploadStep({ csvFile, isLoading, errors, onFileUpload }: UploadStepProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload CSV File
                </CardTitle>
                <CardDescription>Select a CSV file containing your transaction data</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
                        <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Drop your CSV file here or click to browse</p>
                            <Input
                                type="file"
                                accept=".csv"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        onFileUpload(file);
                                    }
                                }}
                                className="mx-auto max-w-xs"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    {isLoading && (
                        <Alert>
                            <Upload className="h-4 w-4 animate-spin" />
                            <AlertDescription>Processing CSV file...</AlertDescription>
                        </Alert>
                    )}
                    {csvFile && !isLoading && (
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                File selected: {csvFile.name} ({Math.round(csvFile.size / 1024)} KB)
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
}
