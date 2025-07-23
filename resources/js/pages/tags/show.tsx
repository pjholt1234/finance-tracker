import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, Tag as TagIcon, Calendar, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Tag, TagCriteria } from '@/types/global';

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
                            <div
                                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                style={{ backgroundColor: tag.color }}
                            />
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{tag.name}</h1>
                                {tag.description && (
                                    <p className="text-muted-foreground">{tag.description}</p>
                                )}
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
                                <span className="text-sm font-medium">Color</span>
                                <div className="flex items-center space-x-2">
                                    <div
                                        className="w-4 h-4 rounded border"
                                        style={{ backgroundColor: tag.color }}
                                    />
                                    <span className="text-sm text-muted-foreground">{tag.color}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Created</span>
                                <span className="text-sm text-muted-foreground">
                                    {formatDate(tag.created_at)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Last Updated</span>
                                <span className="text-sm text-muted-foreground">
                                    {formatDate(tag.updated_at)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Auto-apply Criteria */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Auto-apply Criteria</CardTitle>
                            <CardDescription>
                                Rules for automatically applying this tag to transactions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tag.criterias.length > 0 ? (
                                <div className="space-y-3">
                                    {tag.criterias.map((criteria, index) => (
                                        <div key={criteria.id} className="space-y-2">
                                            <div className="flex items-center justify-between p-3 border rounded-lg">
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
                                                        {criteria.type === "description" && (
                                                            <span>"{criteria.value}"</span>
                                                        )}
                                                        {criteria.type === "amount" && (
                                                            <span>
                                                                {criteria.match_type === 'range' && criteria.value_to
                                                                    ? `$${criteria.value} - $${criteria.value_to}`
                                                                    : `$${criteria.value}`
                                                                }
                                                            </span>
                                                        )}
                                                        {criteria.type === "date" && (
                                                            <span>
                                                                {criteria.match_type === 'day_of_month'
                                                                    ? `Day ${criteria.day_of_month || criteria.value} of month`
                                                                    : criteria.match_type === 'day_of_week'
                                                                        ? (() => {
                                                                            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                                                                            const dayNumber = criteria.day_of_week || parseInt(criteria.value || '1');
                                                                            const dayName = days[dayNumber - 1] || 'Unknown';
                                                                            return dayName;
                                                                        })()
                                                                        : criteria.value
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Show operator between criteria */}
                                            {index < tag.criterias.length - 1 && (
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
                                <div className="text-center py-6">
                                    <p className="text-sm text-muted-foreground">
                                        No auto-apply criteria configured
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Transactions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>
                            Latest transactions tagged with "{tag.name}"
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {tag.transactions.length > 0 ? (
                            <div className="space-y-4">
                                {tag.transactions.map((transaction) => (
                                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">
                                                    {formatDate(transaction.date)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {transaction.description}
                                            </p>
                                            {transaction.reference && (
                                                <div className="flex items-center space-x-1 mt-1">
                                                    <Hash className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">
                                                        {transaction.reference}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            {(transaction.paid_in ?? 0) > 0 && (
                                                <div className="text-sm font-medium text-green-600">
                                                    +{transaction.paid_in}
                                                </div>
                                            )}
                                            {(transaction.paid_out ?? 0) > 0 && (
                                                <div className="text-sm font-medium text-red-600">
                                                    -{transaction.paid_out}
                                                </div>
                                            )}
                                            <div className="text-xs text-muted-foreground">
                                                Balance: {transaction.balance}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <TagIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    No transactions tagged with "{tag.name}" yet
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
