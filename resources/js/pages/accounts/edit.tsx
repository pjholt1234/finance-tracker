import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle, Building2, Hash, Calendar, DollarSign } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';

interface Account {
    id: number;
    name: string;
    number: number;
    sort_code?: string;
    description?: string;
    balance_at_start: number;
    balance: number;
    formatted_balance: string;
    formatted_balance_at_start: string;
    user_id: number;
    created_at: string;
    updated_at: string;
}

interface FormData {
    name: string;
    number: string;
    sort_code: string;
    description: string;
    balance_at_start: number; // Balance in pennies
    [key: string]: any;
}

interface Props {
    account: Account;
}

const breadcrumbs = (account: Account): BreadcrumbItem[] => [
    {
        title: 'Accounts',
        href: '/accounts',
    },
    {
        title: account.name,
        href: `/accounts/${account.id}`,
    },
    {
        title: 'Edit',
        href: `/accounts/${account.id}/edit`,
    },
];

export default function EditAccount({ account }: { account: Account }) {
    const { data, setData, put, processing, errors } = useForm<FormData>({
        name: account.name,
        number: account.number.toString(),
        sort_code: account.sort_code || '',
        description: account.description || '',
        balance_at_start: account.balance_at_start || 0, // Already in pennies
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('accounts.update', account.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(account)}>
            <Head title={`Edit ${account.name}`} />

            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={route('accounts.show', account.id)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Account</h1>
                        <p className="text-muted-foreground">
                            Update the details for {account.name}.
                        </p>
                    </div>
                </div>

                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Building2 className="h-5 w-5" />
                                <span>Account Details</span>
                            </CardTitle>
                            <CardDescription>
                                Update the details for your bank account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Account Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="e.g., Main Current Account"
                                            className={errors.name ? 'border-destructive' : ''}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="number">Account Number</Label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="number"
                                                value={data.number}
                                                onChange={(e) => setData('number', e.target.value)}
                                                placeholder="12345678"
                                                className={`pl-10 ${errors.number ? 'border-destructive' : ''}`}
                                            />
                                        </div>
                                        {errors.number && (
                                            <p className="text-sm text-destructive">{errors.number}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sort_code">Sort Code (Optional)</Label>
                                    <Input
                                        id="sort_code"
                                        value={data.sort_code}
                                        onChange={(e) => setData('sort_code', e.target.value)}
                                        placeholder="12-34-56"
                                        className={errors.sort_code ? 'border-destructive' : ''}
                                    />
                                    {errors.sort_code && (
                                        <p className="text-sm text-destructive">{errors.sort_code}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Additional notes about this account..."
                                        rows={3}
                                        className={errors.description ? 'border-destructive' : ''}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-destructive">{errors.description}</p>
                                    )}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="balance_at_start">Starting Balance (Optional)</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="balance_at_start"
                                                type="number"
                                                step="0.01"
                                                value={data.balance_at_start === 0 ? '' : (data.balance_at_start / 100).toString()}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === '') {
                                                        setData('balance_at_start', 0);
                                                    } else {
                                                        const numValue = parseFloat(value);
                                                        if (!isNaN(numValue)) {
                                                            setData('balance_at_start', Math.round(numValue * 100));
                                                        }
                                                    }
                                                }}
                                                placeholder="0.00"
                                                className={`pl-10 ${errors.balance_at_start ? 'border-destructive' : ''}`}
                                            />
                                        </div>
                                        {errors.balance_at_start && (
                                            <p className="text-sm text-destructive">{errors.balance_at_start}</p>
                                        )}
                                    </div>
                                </div>

                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Changing the starting balance will recalculate your current balance based on existing transactions.
                                        Current balance: <strong>{(account.balance / 100).toFixed(2)}</strong>
                                    </AlertDescription>
                                </Alert>

                                <div className="flex items-center space-x-4">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Updating...' : 'Update Account'}
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <Link href={route('accounts.show', account.id)}>Cancel</Link>
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
} 