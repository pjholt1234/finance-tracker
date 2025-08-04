import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Tag } from '@/types/global';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Edit, Hash, Tag as TagIcon } from 'lucide-react';

interface Props {
    tag: Tag;
}

export default function TagsShow({ tag }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Tags',
            href: '/tags',
        },
        {
            title: tag.name,
            href: `/tags/${tag.id}`,
        },
    ];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Add null checks for arrays
    const criterias = tag.criterias || [];
    const transactions = tag.transactions || [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={tag.name} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={route('tags.index')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Tags
                            </Link>
                        </Button>
                        <div className="flex items-center space-x-3">
                            <div className="h-6 w-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: tag.color }} />
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{tag.name}</h1>
                                {tag.description && <p className="text-muted-foreground">{tag.description}</p>}
                            </div>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href={route('tags.edit', tag.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Tag
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Tag Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <TagIcon className="h-5 w-5" />
                                <span>Tag Details</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Status</span>
                                <Badge variant={tag.archived ? 'outline' : 'secondary'}>{tag.archived ? 'Archived' : 'Active'}</Badge>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Color</span>
                                <div className="flex items-center space-x-2">
                                    <div className="h-4 w-4 rounded border" style={{ backgroundColor: tag.color }} />
                                    <span className="text-sm text-muted-foreground">{tag.color}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Created</span>
                                <span className="text-sm text-muted-foreground">{formatDate(tag.created_at)}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Last Updated</span>
                                <span className="text-sm text-muted-foreground">{formatDate(tag.updated_at)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Auto-apply Criteria */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Auto-apply Criteria</CardTitle>
                            <CardDescription>Rules for automatically applying this tag to transactions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {criterias.length > 0 ? (
                                <div className="space-y-3">
                                    {criterias.map((criteria, index) => (
                                        <div key={criteria.id} className="space-y-2">
                                            <div className="flex items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center space-x-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {criteria.type.charAt(0).toUpperCase() + criteria.type.slice(1)}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {criteria.match_type.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-sm">
                                                        {criteria.type === 'description' && <span>"{criteria.value}"</span>}
                                                        {criteria.type === 'amount' && (
                                                            <span>
                                                                {criteria.match_type === 'range' && criteria.value_to
                                                                    ? `$${criteria.value} - $${criteria.value_to}`
                                                                    : `$${criteria.value}`}
                                                            </span>
                                                        )}
                                                        {criteria.type === 'date' && (
                                                            <span>
                                                                {criteria.match_type === 'day_of_month'
                                                                    ? `Day ${criteria.day_of_month || criteria.value} of month`
                                                                    : criteria.match_type === 'day_of_week'
                                                                      ? (() => {
                                                                            const days = [
                                                                                'Monday',
                                                                                'Tuesday',
                                                                                'Wednesday',
                                                                                'Thursday',
                                                                                'Friday',
                                                                                'Saturday',
                                                                                'Sunday',
                                                                            ];
                                                                            const dayNumber = criteria.day_of_week || parseInt(criteria.value || '1');
                                                                            const dayName = days[dayNumber - 1] || 'Unknown';
                                                                            return dayName;
                                                                        })()
                                                                      : criteria.value}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Show operator between criteria */}
                                            {index < criterias.length - 1 && (
                                                <div className="flex justify-center">
                                                    <Badge variant="outline" className="text-xs font-medium">
                                                        {criteria.logic_type === 'or' ? 'OR' : 'AND'}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <p className="text-sm text-muted-foreground">No auto-apply criteria configured</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Transactions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>Latest transactions tagged with "{tag.name}"</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {transactions.length > 0 ? (
                            <div className="space-y-4">
                                {transactions.map((transaction) => (
                                    <div key={transaction.id} className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">{formatDate(transaction.date)}</span>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">{transaction.description}</p>
                                            {transaction.reference && (
                                                <div className="mt-1 flex items-center space-x-1">
                                                    <Hash className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">{transaction.reference}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            {(transaction.paid_in ?? 0) > 0 && (
                                                <div className="text-sm font-medium text-green-600">+{transaction.paid_in}</div>
                                            )}
                                            {(transaction.paid_out ?? 0) > 0 && (
                                                <div className="text-sm font-medium text-red-600">-{transaction.paid_out}</div>
                                            )}
                                            <div className="text-xs text-muted-foreground">Balance: {transaction.balance}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <TagIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">No transactions tagged with "{tag.name}" yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
