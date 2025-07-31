import { ConfigureStep, PreviewStep, SaveStep, UploadStep } from '@/components/csv-schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { CsvPreviewData } from '@/types/global';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

type StepValue = (typeof STEPS)[keyof typeof STEPS];

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

    const { data, setData, processing, errors } = useForm<CreateSchemaForm>({
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

    const handleFileUpload = useCallback(
        (file: File) => {
            setData('csv_file', file);
            setIsLoadingPreview(true);

            const formData = new FormData();
            formData.append('csv_file', file);

            router.post(route('csv-schemas.preview'), formData, {
                onFinish: () => {
                    setIsLoadingPreview(false);
                },
                onError: () => {
                    setIsLoadingPreview(false);
                },
                onSuccess: () => {},
                preserveState: false,
                preserveScroll: false,
            });
        },
        [setData],
    );

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

    const toNumber = (value: string | number | null | undefined, defaultValue: number = 0): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const parsed = parseInt(value);
            return isNaN(parsed) ? defaultValue : parsed;
        }
        return defaultValue;
    };

    const toNumberOrNull = (value: string | number | null | undefined): number | null => {
        if (typeof value === 'number') return value || null;
        if (typeof value === 'string') {
            const parsed = parseInt(value);
            return isNaN(parsed) ? null : parsed;
        }
        return null;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const submitData = {
            ...data,
            transaction_data_start: toNumber(data.transaction_data_start, 1),
            date_column: toNumber(data.date_column),
            balance_column: toNumber(data.balance_column),
            amount_column: toNumberOrNull(data.amount_column),
            paid_in_column: toNumberOrNull(data.paid_in_column),
            paid_out_column: toNumberOrNull(data.paid_out_column),
            description_column: toNumberOrNull(data.description_column),
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
                    return data.date_column && data.balance_column && (data.paid_in_column || data.paid_out_column);
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
                return <UploadStep csvFile={data.csv_file} isLoading={isLoadingPreview} errors={errors} onFileUpload={handleFileUpload} />;

            case STEPS.PREVIEW:
                return (
                    <PreviewStep
                        csvPreview={csvPreview}
                        transactionDataStart={data.transaction_data_start}
                        onTransactionDataStartChange={(value) => setData('transaction_data_start', value)}
                        errors={errors}
                    />
                );

            case STEPS.CONFIGURE:
                return <ConfigureStep csvPreview={csvPreview} data={data} errors={errors} onDataChange={setData} />;

            case STEPS.SAVE:
                return (
                    <SaveStep
                        data={data}
                        errors={errors}
                        processing={processing}
                        onDataChange={setData}
                        onSubmit={handleSubmit}
                        onBack={handleBack}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create CSV Schema" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Create CSV Schema</h2>
                        <p className="mt-1 text-muted-foreground">Set up a new CSV import configuration</p>
                    </div>
                    <Link href={route('csv-schemas.index')}>
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Schemas
                        </Button>
                    </Link>
                </div>

                {/* Progress Bar */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>
                                    Step {currentStep} of {Object.keys(STEPS).length}
                                </span>
                                <span>{Math.round(getStepProgress())}% complete</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted">
                                <div
                                    className="h-2 rounded-full bg-primary transition-all duration-300 ease-in-out"
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
                                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
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
