import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';

interface Tag {
    id: number;
    name: string;
    color: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    tag: Tag;
}

export default function TagsEdit({ tag }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: tag.name,
        color: tag.color,
        description: tag.description || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('tags.update', tag.id));
    };

    const generateRandomColor = () => {
        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
            '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
            '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
            '#ec4899', '#f43f5e'
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        setData('color', randomColor);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Tags',
            href: '/tags',
        },
        {
            title: tag.name,
            href: `/tags/${tag.id}/edit`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${tag.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('tags.index')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Tags
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Tag</h1>
                        <p className="text-muted-foreground">
                            Update the details for "{tag.name}".
                        </p>
                    </div>
                </div>

                {/* Form */}
                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Tag Details</CardTitle>
                        <CardDescription>
                            Update the tag name, color, and description.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Enter tag name"
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">{errors.name}</p>
                                )}
                            </div>

                            {/* Color */}
                            <div className="space-y-2">
                                <Label htmlFor="color">Color</Label>
                                <div className="flex items-center space-x-3">
                                    <Input
                                        id="color"
                                        type="color"
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                        className="w-16 h-10 p-1 border rounded"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={generateRandomColor}
                                    >
                                        Random Color
                                    </Button>
                                    {data.color && (
                                        <div className="flex items-center space-x-2">
                                            <div
                                                className="w-6 h-6 rounded border"
                                                style={{ backgroundColor: data.color }}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {data.color}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {errors.color && (
                                    <p className="text-sm text-red-500">{errors.color}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Optional description for this tag"
                                    rows={3}
                                    className={errors.description ? 'border-red-500' : ''}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-500">{errors.description}</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end space-x-3">
                                <Button variant="outline" asChild>
                                    <Link href={route('tags.index')}>
                                        Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 