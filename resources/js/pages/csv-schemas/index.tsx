import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { CsvSchema } from '@/types/global';
import { formatDate } from '@/utils/date';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, DollarSign, FileText, Hash, MoreHorizontal, Plus } from 'lucide-react';

interface Props {
    schemas: CsvSchema[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'CSV Schemas',
        href: '/csv-schemas',
    },
];

export default function Index({ schemas }: Props) {
    const handleDelete = (schema: CsvSchema) => {
        if (confirm(`Are you sure you want to delete the schema "${schema.name}"?`)) {
            router.delete(route('csv-schemas.destroy', schema.id));
        }
    };

    const getAmountConfiguration = (schema: CsvSchema) => {
        if (schema.amount_column) {
            return {
                type: 'Single Amount',
                details: `Column ${schema.amount_column}`,
            };
        } else if (schema.paid_in_column || schema.paid_out_column) {
            const details = [];
            if (schema.paid_in_column) details.push(`In: ${schema.paid_in_column}`);
            if (schema.paid_out_column) details.push(`Out: ${schema.paid_out_column}`);
            return {
                type: 'Split Amount',
                details: details.join(', '),
            };
        }
        return {
            type: 'Not configured',
            details: 'No amount columns',
        };
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="CSV Schemas" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">CSV Schemas</h1>
                        <p className="text-muted-foreground">Manage your CSV import configurations</p>
                    </div>
                    <Button asChild>
                        <Link href={route('csv-schemas.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Schema
                        </Link>
                    </Button>
                </div>

                {/* Schema Cards */}
                {schemas.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-semibold">No CSV schemas yet</h3>
                            <p className="mb-6 text-center text-muted-foreground">
                                Create your first CSV schema to define how your transaction files should be imported.
                            </p>
                            <Button asChild>
                                <Link href={route('csv-schemas.create')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Schema
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {schemas.map((schema) => {
                            const amountConfig = getAmountConfiguration(schema);

                            return (
                                <Card key={schema.id} className="transition-shadow hover:shadow-md">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg">{schema.name}</CardTitle>
                                                <CardDescription className="mt-1">Created {formatDate(schema.created_at)}</CardDescription>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('csv-schemas.show', schema.id)}>View Schema</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('csv-schemas.edit', schema.id)}>Edit Schema</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(schema)} className="text-destructive">
                                                        Delete Schema
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-0">
                                        <div className="space-y-3">
                                            <div className="flex items-center text-sm">
                                                <Hash className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <span>Data starts at row {schema.transaction_data_start}</span>
                                            </div>

                                            <div className="flex items-center text-sm">
                                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <span>Date: {schema.date_column}</span>
                                                {schema.date_format && (
                                                    <Badge variant="secondary" className="ml-2 text-xs">
                                                        {schema.date_format}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex items-center text-sm">
                                                <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <span>Balance: {schema.balance_column}</span>
                                            </div>

                                            <div className="flex items-center text-sm">
                                                <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <div className="flex-1">
                                                    <div className="font-medium">{amountConfig.type}</div>
                                                    <div className="text-xs text-muted-foreground">{amountConfig.details}</div>
                                                </div>
                                            </div>

                                            {schema.description_column && (
                                                <div className="flex items-center text-sm">
                                                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    <span>Description: {schema.description_column}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
