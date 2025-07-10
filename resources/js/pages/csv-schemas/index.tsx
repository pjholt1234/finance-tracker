import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, FileText, Calendar, DollarSign, Hash } from 'lucide-react';
import { type BreadcrumbItem, type SharedData } from '@/types';
import AppLayout from '@/layouts/app-layout';

interface CsvSchema {
    id: number;
    name: string;
    transaction_data_start: number;
    date_column: string;
    balance_column: string;
    amount_column?: string;
    paid_in_column?: string;
    paid_out_column?: string;
    description_column?: string;
    date_format?: string;
    created_at: string;
    updated_at: string;
}

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
            return { type: 'single', column: schema.amount_column };
        }

        const columns = [];
        if (schema.paid_in_column) columns.push(`In: ${schema.paid_in_column}`);
        if (schema.paid_out_column) columns.push(`Out: ${schema.paid_out_column}`);

        return { type: 'split', column: columns.join(', ') };
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="CSV Schemas" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">CSV Schemas</h2>
                        <p className="text-muted-foreground mt-1">
                            Manage your CSV import configurations
                        </p>
                    </div>
                    <Link href={route('csv-schemas.create')}>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Schema
                        </Button>
                    </Link>
                </div>

                {schemas.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No CSV schemas yet</h3>
                            <p className="text-muted-foreground text-center mb-6">
                                Create your first CSV schema to start importing transaction data.
                            </p>
                            <Link href={route('csv-schemas.create')}>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Your First Schema
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {schemas.map((schema) => {
                            const amountConfig = getAmountConfiguration(schema);

                            return (
                                <Card key={schema.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg">{schema.name}</CardTitle>
                                                <CardDescription className="mt-1">
                                                    Created {new Date(schema.created_at).toLocaleDateString()}
                                                </CardDescription>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('csv-schemas.show', schema.id)}>
                                                            View
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('csv-schemas.edit', schema.id)}>
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(schema)}
                                                        className="text-destructive"
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-3">
                                            <div className="flex items-center text-sm">
                                                <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>Data starts at row {schema.transaction_data_start}</span>
                                            </div>

                                            <div className="flex items-center text-sm">
                                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>Date: {schema.date_column}</span>
                                                {schema.date_format && (
                                                    <Badge variant="secondary" className="ml-2 text-xs">
                                                        {schema.date_format}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex items-center text-sm">
                                                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>Balance: {schema.balance_column}</span>
                                            </div>

                                            <div className="flex items-start text-sm">
                                                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                                                <div>
                                                    <span>Amount: </span>
                                                    <Badge
                                                        variant={amountConfig.type === 'single' ? 'default' : 'outline'}
                                                        className="text-xs"
                                                    >
                                                        {amountConfig.type === 'single' ? 'Single' : 'Split'}
                                                    </Badge>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {amountConfig.column}
                                                    </div>
                                                </div>
                                            </div>

                                            {schema.description_column && (
                                                <div className="flex items-center text-sm">
                                                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
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