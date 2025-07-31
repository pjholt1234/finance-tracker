import { ActionMenu } from '@/components/ui/action-menu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGrid } from '@/components/ui/card-grid';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { useCurrencyFormat } from '@/hooks/use-currency-format';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Account } from '@/types/global';
import { Head, Link, router } from '@inertiajs/react';
import { Building2, CreditCard, DollarSign, Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

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
    const { formatCurrency } = useCurrencyFormat();

    const handleDelete = (account: Account) => {
        router.delete(route('accounts.destroy', account.id), {
            onSuccess: () => {
                setDeletingAccount(null);
            },
        });
    };

    const renderAccountCard = (account: Account) => (
        <Card key={account.id} className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{account.name}</CardTitle>
                    </div>
                    <ActionMenu
                        actions={[
                            {
                                label: 'View',
                                icon: Eye,
                                href: route('accounts.show', account.id),
                            },
                            {
                                label: 'Edit',
                                icon: Edit,
                                href: route('accounts.edit', account.id),
                            },
                            {
                                label: 'Delete',
                                icon: Trash2,
                                onClick: () => setDeletingAccount(account),
                                variant: 'destructive',
                            },
                        ]}
                    />
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
                            <span className="font-semibold">{formatCurrency(account.balance)}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Starting Balance</span>
                        <span>{formatCurrency(account.balance_at_start)}</span>
                    </div>

                    {account.description && <p className="line-clamp-2 text-sm text-muted-foreground">{account.description}</p>}

                    <div className="pt-2">
                        <Button variant="outline" size="sm" asChild className="w-full">
                            <Link href={route('accounts.show', account.id)}>View Details</Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Accounts" />

            <div className="space-y-6">
                <PageHeader
                    title="Accounts"
                    description="Manage your bank accounts and view their balances."
                    action={{
                        href: route('accounts.create'),
                        label: 'Add Account',
                        icon: Plus,
                    }}
                />

                {accounts.length === 0 ? (
                    <EmptyState
                        icon={Building2}
                        title="No accounts yet"
                        description="Create your first account to start importing transactions."
                        action={{
                            href: route('accounts.create'),
                            label: 'Add Account',
                            icon: Plus,
                        }}
                    />
                ) : (
                    <CardGrid items={accounts} renderItem={renderAccountCard} columns={{ sm: 1, md: 2, lg: 3 }} />
                )}
            </div>

            <ConfirmationDialog
                open={!!deletingAccount}
                onOpenChange={() => setDeletingAccount(null)}
                title="Delete Account"
                description={`Are you sure you want to delete "${deletingAccount?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={() => deletingAccount && handleDelete(deletingAccount)}
                variant="destructive"
                additionalInfo="Note: You can only delete accounts that have no imports or transactions."
            />
        </AppLayout>
    );
}
