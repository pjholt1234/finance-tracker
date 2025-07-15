import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    Edit,
    Calendar,
    DollarSign,
    Hash,
    FileText,
    Clock,
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/utils/date';
import { CsvSchema } from '@/types/global';

interface Props {
    schema: CsvSchema;
}

export default function Show({ schema }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'CSV Schemas',
            href: '/csv-schemas',
        },
        {
            title: schema.name,
            href: `/csv-schemas/${schema.id}`,
        },
    ];

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this schema?')) {
            router.delete(route('csv-schemas.destroy', schema.id));
        }
    };

    const getAmountConfiguration = () => {
        if (schema.amount_column) {
            return {
                type: 'Single Amount Column',
                details: `Column ${schema.amount_column}`,
            };
        } else if (schema.paid_in_column || schema.paid_out_column) {
            const details = [];
            if (schema.paid_in_column) details.push(`Paid In: Column ${schema.paid_in_column}`);
            if (schema.paid_out_column) details.push(`Paid Out: Column ${schema.paid_out_column}`);
            return {
                type: 'Separate Amount Columns',
                details: details.join(', '),
            };
        }
        return {
            type: 'Not configured',
            details: 'No amount columns specified',
        };
    };

    const amountConfig = getAmountConfiguration();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={schema.name} />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={route('csv-schemas.index')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{schema.name}</h1>
                            <p className="text-muted-foreground">
                                CSV Schema Configuration
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" asChild>
                            <Link href={route('csv-schemas.edit', schema.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Schema
                            </Link>
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete Schema
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Schema Name</span>
                                <span className="text-sm">{schema.name}</span>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Transaction Data Start</span>
                                <Badge variant="secondary">Row {schema.transaction_data_start}</Badge>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Created</span>
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    {formatDateTime(schema.created_at)}
                                </div>
                            </div>

                            {schema.updated_at !== schema.created_at && (
                                <>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Last Updated</span>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            {formatDateTime(schema.updated_at)}
                                        </div>
                                    </div>
                                </>
                            )}
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
                                How CSV columns are mapped to transaction fields
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Date Column</span>
                                </div>
                                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                    Column {schema.date_column}
                                </span>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Balance Column</span>
                                </div>
                                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                    Column {schema.balance_column}
                                </span>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Amount Configuration</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium">{amountConfig.type}</div>
                                    <div className="text-xs text-muted-foreground">{amountConfig.details}</div>
                                </div>
                            </div>

                            {schema.description_column && (
                                <>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Description Column</span>
                                        </div>
                                        <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                            Column {schema.description_column}
                                        </span>
                                    </div>
                                </>
                            )}

                            {schema.date_format && (
                                <>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Date Format</span>
                                        </div>
                                        <Badge variant="secondary">
                                            {schema.date_format}
                                        </Badge>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
