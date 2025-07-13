import { Head, Link } from '@inertiajs/react';
import { Plus, Tag as TagIcon, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tags" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
                        <p className="text-muted-foreground">
                            Manage your transaction tags and categorization rules.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={route('tags.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Tag
                        </Link>
                    </Button>
                </div>

                {/* Tags Grid */}
                {tags.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {tags.map((tag) => (
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
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={route('tags.show', tag.id)}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={route('tags.edit', tag.id)}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
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
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <TagIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No tags yet</h3>
                        <p className="mt-2 text-muted-foreground">
                            Create your first tag to start categorizing your transactions.
                        </p>
                        <div className="mt-6">
                            <Button asChild>
                                <Link href={route('tags.create')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First Tag
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
} 