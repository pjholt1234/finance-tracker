import { Head, Link } from '@inertiajs/react';
import { Plus, Tag as TagIcon, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ActionMenu } from '@/components/ui/action-menu';
import { CardGrid } from '@/components/ui/card-grid';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';

interface Tag {
    id: number;
    name: string;
    color: string;
    description: string | null;
    transactions_count: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    tags: Tag[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tags',
        href: '/tags',
    },
];

export default function TagsIndex({ tags }: Props) {
    const renderTagCard = (tag: Tag) => (
        <Card key={tag.id} className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                        <div
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: tag.color }}
                        />
                        <CardTitle className="text-lg">{tag.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ActionMenu
                            actions={[
                                {
                                    label: 'View',
                                    icon: Eye,
                                    href: route('tags.show', tag.id),
                                },
                                {
                                    label: 'Edit',
                                    icon: Edit,
                                    href: route('tags.edit', tag.id),
                                },
                            ]}
                        />
                    </div>
                </div>
                {tag.description && (
                    <CardDescription className="text-sm">
                        {tag.description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                        {tag.transactions_count} transaction{tag.transactions_count !== 1 ? 's' : ''}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                        Created {new Date(tag.created_at).toLocaleDateString()}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tags" />

            <div className="space-y-6">
                <PageHeader
                    title="Tags"
                    description="Manage your transaction tags and categorization rules."
                    action={{
                        href: route('tags.create'),
                        label: 'Create Tag',
                        icon: Plus,
                    }}
                />

                {tags.length > 0 ? (
                    <CardGrid
                        items={tags}
                        renderItem={renderTagCard}
                        columns={{ sm: 1, md: 2, lg: 3 }}
                        className="gap-6"
                    />
                ) : (
                    <EmptyState
                        icon={TagIcon}
                        title="No tags yet"
                        description="Create your first tag to start categorizing your transactions."
                        action={{
                            href: route('tags.create'),
                            label: 'Create Your First Tag',
                            icon: Plus,
                        }}
                    />
                )}
            </div>
        </AppLayout>
    );
} 