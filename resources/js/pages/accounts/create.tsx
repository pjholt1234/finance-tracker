import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { handleCurrencyChange } from '@/utils/currency-change-handler';
import { Head, Link, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Building2, DollarSign, Hash } from 'lucide-react';
import { FormEvent } from 'react';

interface FormData {
    name: string;
    number: string;
    sort_code: string;
    description: string;
    balance_at_start: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Accounts',
        href: '/accounts',
    },
    {
        title: 'Create Account',
        href: '/accounts/create',
    },
];

export default function CreateAccount() {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        number: '',
        sort_code: '',
        description: '',
        balance_at_start: 0,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('accounts.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Account" />

            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={route('accounts.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
                        <p className="text-muted-foreground">Add a new bank account to start importing transactions.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Building2 className="h-5 w-5" />
                                <span>Account Details</span>
                            </CardTitle>
                            <CardDescription>Enter the details for your new bank account.</CardDescription>
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
                                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="number">Account Number</Label>
                                        <div className="relative">
                                            <Hash className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="number"
                                                value={data.number}
                                                onChange={(e) => setData('number', e.target.value)}
                                                placeholder="12345678"
                                                className={`pl-10 ${errors.number ? 'border-destructive' : ''}`}
                                            />
                                        </div>
                                        {errors.number && <p className="text-sm text-destructive">{errors.number}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="sort_code">Sort Code</Label>
                                        <Input
                                            id="sort_code"
                                            value={data.sort_code}
                                            onChange={(e) => setData('sort_code', e.target.value)}
                                            placeholder="12-34-56"
                                            className={errors.sort_code ? 'border-destructive' : ''}
                                        />
                                        {errors.sort_code && <p className="text-sm text-destructive">{errors.sort_code}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="balance_at_start">Starting Balance</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="balance_at_start"
                                                type="number"
                                                step="0.01"
                                                value={data.balance_at_start === 0 ? '' : (data.balance_at_start / 100).toString()}
                                                onChange={(e) => handleCurrencyChange(e, setData, 'balance_at_start')}
                                                placeholder="0.00"
                                                className={`pl-10 ${errors.balance_at_start ? 'border-destructive' : ''}`}
                                            />
                                        </div>
                                        {errors.balance_at_start && <p className="text-sm text-destructive">{errors.balance_at_start}</p>}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Additional notes about this account..."
                                        rows={3}
                                        className={errors.description ? 'border-destructive' : ''}
                                    />
                                    {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                                </div>

                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        The starting balance will be used to calculate your current balance based on imported transactions. You can
                                        update this later if needed.
                                    </AlertDescription>
                                </Alert>

                                <div className="flex items-center space-x-4">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Creating...' : 'Create Account'}
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <Link href={route('accounts.index')}>Cancel</Link>
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
