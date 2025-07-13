import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    Plus,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    CreditCard,
    DollarSign,
    Building2
} from 'lucide-react';
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

interface Props {
    accounts: Account[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Accounts',
        href: '/accounts',
    },
];

export default function AccountsIndex({ accounts }: Props) {
    const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

    const handleDelete = (account: Account) => {
        router.delete(route('accounts.destroy', account.id), {
            onSuccess: () => {
                setDeletingAccount(null);
            },
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatBalance = (balance: number) => {
        return formatCurrency(balance / 100);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Accounts" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
                        <p className="text-muted-foreground">
                            Manage your bank accounts and view their balances.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={route('accounts.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Account
                        </Link>
                    </Button>
                </div>

                {accounts.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Create your first account to start importing transactions.
                            </p>
                            <Button asChild>
                                <Link href={route('accounts.create')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Account
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {accounts.map((account) => (
                            <Card key={account.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                                            <CardTitle className="text-lg">{account.name}</CardTitle>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={route('accounts.show', account.id)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={route('accounts.edit', account.id)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setDeletingAccount(account)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardDescription>
                                        Account {account.number} • {account.sort_code}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Current Balance</span>
                                            <div className="flex items-center space-x-1">
                                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-semibold">
                                                    {formatBalance(account.balance)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Starting Balance</span>
                                            <span>{formatBalance(account.balance_at_start)}</span>
                                        </div>

                                        {account.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {account.description}
                                            </p>
                                        )}

                                        <div className="pt-2">
                                            <Button variant="outline" size="sm" asChild className="w-full">
                                                <Link href={route('accounts.show', account.id)}>
                                                    View Details
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={!!deletingAccount} onOpenChange={() => setDeletingAccount(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Account</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deletingAccount?.name}"? This action cannot be undone.
                            {deletingAccount && (
                                <span className="block mt-2 text-sm text-muted-foreground">
                                    Note: You can only delete accounts that have no imports or transactions.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingAccount(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deletingAccount && handleDelete(deletingAccount)}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
} 