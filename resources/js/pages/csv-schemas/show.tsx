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
    Copy
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

    const getAmountConfiguration = () => {
        if (schema.amount_column) {
            return {
                type: 'Single Amount Column',
                details: schema.amount_column,
            };
        }

        const columns = [];
        if (schema.paid_in_column) columns.push(`In: ${schema.paid_in_column}`);
        if (schema.paid_out_column) columns.push(`Out: ${schema.paid_out_column}`);

        return {
            type: 'Split Amount Columns',
            details: columns.join(', '),
        };
    };

    const amountConfig = getAmountConfiguration();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`CSV Schema: ${schema.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">{schema.name}</h2>
                        <p className="text-muted-foreground mt-1">
                            CSV schema configuration details
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href={route('csv-schemas.edit', schema.id)}>
                            <Button>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Schema
                            </Button>
                        </Link>
                        <Button
                            onClick={() => router.post(route('csv-schemas.clone', schema.id))}
                            variant="outline"
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Clone Schema
                        </Button>
                        <Link href={route('csv-schemas.index')}>
                            <Button variant="outline">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Schemas
                            </Button>
                        </Link>
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
                                    {new Date(schema.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>

                            {schema.updated_at !== schema.created_at && (
                                <>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Last Updated</span>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            {new Date(schema.updated_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
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

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Amount Configuration</span>
                                    </div>
                                    <Badge variant={schema.amount_column ? 'default' : 'outline'}>
                                        {amountConfig.type}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground pl-6">
                                    {amountConfig.details}
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